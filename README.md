# Split

Partage de dépenses « lite ». Pas d'authentification : un groupe est identifié par un UUID
qui sert de lien partageable.

Spring Boot 4.1 · Java 21 · PostgreSQL (Testcontainers) · Liquibase · Spring Data JPA.

## Lancer

Docker doit tourner. Il n'y a **pas** de `spring.datasource.*` dans
`application.properties` : la base est fournie par Testcontainers, à la fois pour les tests
et pour le run local.

```bash
./mvnw spring-boot:test-run     # démarre Postgres en conteneur puis l'application
./mvnw verify                   # compile + tous les tests
```

Swagger UI : <http://localhost:8080/swagger-ui.html>

## API

| Méthode | Chemin | |
|---|---|---|
| `POST` | `/groups` | crée un groupe, renvoie son UUID |
| `GET` | `/groups/{id}` | le groupe et ses membres |
| `POST` | `/groups/{id}/members` | ajoute un membre |
| `POST` | `/groups/{id}/expenses` | ajoute une dépense (payeur, montant, participants) |
| `GET` | `/groups/{id}/expenses` | l'historique, avec le détail des parts |
| `GET` | `/groups/{id}/balances` | le solde net de chaque membre |
| `GET` | `/groups/{id}/settlements` | qui rembourse qui, et combien |

Les erreurs sortent en `application/problem+json` (RFC 9457) : 400 pour un payload invalide
(avec la liste des champs fautifs), 404 pour un groupe inconnu, 422 pour un payeur ou un
participant qui n'appartient pas au groupe.

### Démo au curl

```bash
G=$(curl -s -XPOST localhost:8080/groups -H 'Content-Type: application/json' \
     -d '{"name":"Week-end Annecy"}' | jq -r .id)

A=$(curl -s -XPOST localhost:8080/groups/$G/members -H 'Content-Type: application/json' \
     -d '{"name":"Alice"}' | jq -r .id)
B=$(curl -s -XPOST localhost:8080/groups/$G/members -H 'Content-Type: application/json' \
     -d '{"name":"Bob"}' | jq -r .id)
C=$(curl -s -XPOST localhost:8080/groups/$G/members -H 'Content-Type: application/json' \
     -d '{"name":"Carol"}' | jq -r .id)

curl -s -XPOST localhost:8080/groups/$G/expenses -H 'Content-Type: application/json' \
  -d "{\"description\":\"Courses\",\"amount\":\"60.00\",\"payerId\":\"$A\",\"participantIds\":[\"$A\",\"$B\",\"$C\"]}"
curl -s -XPOST localhost:8080/groups/$G/expenses -H 'Content-Type: application/json' \
  -d "{\"description\":\"Taxi\",\"amount\":\"30.00\",\"payerId\":\"$B\",\"participantIds\":[\"$A\",\"$B\",\"$C\"]}"

curl -s localhost:8080/groups/$G/balances | jq     # Alice +30, Bob 0, Carol -30
curl -s localhost:8080/groups/$G/settlements | jq  # Carol -> Alice : 30,00
```

## Modèle

`expense_group` → `group_member` → `expense` → `expense_share`.
(`group` est un mot réservé PostgreSQL, d'où le préfixe.)

Les parts d'une dépense sont **calculées à la création et persistées**, pas recalculées à
la lecture : l'arrondi est figé une fois pour toutes, chaque solde est auditable ligne à
ligne, et changer plus tard la règle de répartition ne réécrit pas l'historique.

## Le centime perdu

10,00 € entre trois personnes, c'est 3,3333… chacun. Arrondir chaque part fait apparaître
ou disparaître un centime, et les soldes ne somment plus à zéro. `ShareSplitter` divise
donc en centimes entiers et distribue le reste (`total % n`) un centime par personne, dans
l'ordre des UUID pour que le résultat soit reproductible :

```
10,00 / 3  →  3,34 + 3,33 + 3,33  =  10,00   exactement
```

Tout l'algorithme travaille en `long` de centimes ; `BigDecimal` reste à la frontière (API
et base). C'est ce qui rend l'invariant « la somme des soldes vaut zéro » exact et
vérifiable, au lieu d'approximativement vrai.

## Minimiser les remboursements

Une fois les soldes nets connus, reste à décider qui rembourse qui. Deux stratégies sont
implémentées, et la différence entre les deux est le vrai sujet.

**Glouton** — le plus gros débiteur rembourse le plus gros créancier, on recommence.
`O(n log n)`, au plus `n−1` transferts. Mais `n−1` est une borne supérieure, pas le minimum.

**Optimal** — le problème a une caractérisation exacte :

```
minimum de transferts = (membres à solde non nul)
                      − (nombre maximal de sous-ensembles disjoints de somme nulle)
```

Un sous-ensemble de somme nulle de taille `k` se règle en exactement `k−1` transferts et
jamais moins ; maximiser le nombre de ces groupes minimise donc le total. Ce maximum se
trouve par programmation dynamique sur masques de bits (`dp[mask] = max(dp[mask ^ sub] + 1)`
pour tout sous-masque `sub` de somme nulle), puis le glouton est rejoué **à l'intérieur de
chaque groupe**, où il est cette fois exactement optimal.

Le contre-exemple qui sépare les deux, et qui est dans les tests :

```
soldes   +10  +6  −5  −5  −3  −3
glouton  5 transferts
optimal  4 transferts     {+10, −5, −5}  et  {+6, −3, −3}
```

Trouver la partition est NP-difficile (c'est une variante de *subset-sum partition*), d'où
le repli sur le glouton au-delà de 18 soldes non nuls. La réponse de `/settlements` indique
toujours quelle stratégie a été utilisée, pour qu'on sache quelle garantie on obtient.

Une formulation MILP (minimiser `Σ y_ij` binaires sous conservation des flux, avec
`x_ij ≤ M·y_ij`) donne exactement le même optimum, mais imposerait un solveur là où 50
lignes suffisent. Elle redeviendrait le bon outil s'il fallait ajouter un objectif
secondaire — minimiser le montant total déplacé, pondérer par qui accepte de payer qui —
que la DP ne sait pas exprimer.

## Tests

| | |
|---|---|
| `ShareSplitterTest` | la somme des parts égale le total, dans tous les cas |
| `BalanceCalculatorTest` | les soldes nets somment à zéro |
| `SettlementCalculatorTest` | appliquer le plan ramène tout le monde à zéro ; glouton 5 vs optimal 4 |
| `ExpenseControllerTest` | `@WebMvcTest` — codes de retour et forme des `ProblemDetail` |
| `SplitApiIntegrationTests` | `@SpringBootTest` sur Postgres réel, scénario complet |

Les trois premiers sont du JUnit pur, sans contexte Spring : l'algorithme ne dépend ni de
JPA ni du framework, ce qui est exactement ce qui le rend testable en quelques
millisecondes.

## Notes de sécurité

`spring-boot-starter-security` est sur le classpath, donc sans configuration tout
répondrait 401. `SecurityConfig` ouvre l'API en `permitAll()` et coupe CSRF : c'est une API
sans session ni cookie, et CSRF est la seule chose qui rejetterait les POST depuis curl ou
Swagger. Le contrôle d'accès repose entièrement sur le fait de connaître l'UUID du groupe —
ce qui est un choix assumé pour un lien partageable, pas un oubli.
