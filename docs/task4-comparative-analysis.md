# Task 4: Comparative Analysis

## Evidence Basis

This Task 4 report compares the original risk-based plan with the actual observed results preserved in the repository. It does not invent fresh rerun results. Where Task 2 changed the repository structure, those changes are described as implemented improvements, not as newly measured outcomes.

Primary evidence used:

- `docs/risk-assessment.md`
- `docs/QA_Test_Strategy_Assignment2.md`
- `docs/task1-risk-refinement.md`
- `docs/task2-automation-expansion.md`
- `docs/task3-metrics-analysis.md`
- `evidence/AUTOMATION_COVERAGE_TABLE.md`
- `evidence/DEFECTS_RISK_COMPARISON_TABLE.md`
- `evidence/EXECUTION_TIME_TABLE.md`
- `evidence/tests-test-artifacts/results.json`
- `logs/`

## Task 4.1 Planned vs Actual Results

| High-priority area | Original plan / expectation | Actual observed result | Status | Reason |
|---|---|---|---|---|
| Authentication | Prioritize early because access control is business-critical and likely defect-prone. | It was fully automated, but defect volume was higher than expected and auth instability also affected downstream setup. | Partially matched | The prioritization was correct, but actual failures were more severe than the plan assumed. |
| Shopping Cart | Prioritize early because cart state, inventory checks, shipping, and coupon logic are central to purchase flow. | Coverage was broad, but coupon removal was missing in the measured baseline and setup instability weakened confidence. | Partially matched | The module was correctly prioritized, but completeness and detectability were weaker than planned. |
| Checkout and Order Creation | Treat as critical because it is the main transaction path. | Coverage existed, but checkout-related failures and fixture misuse reduced regression trust. | Partially matched | The plan correctly ranked the module, but the execution quality did not fully support the intended confidence level. |
| Admin Product Management | Prioritize as a high-risk admin area that affects catalog integrity. | Automation exists and coverage is complete, but one failure and blocked downstream execution limited confidence. | Mostly matched | Priority and coverage were appropriate, but execution was not fully clean. |
| Order Status Updates | Prioritize because incorrect status changes affect order lifecycle control. | The area was automated and no saved failure was recorded. | Matched | This is the clearest case where planning and observed outcome aligned well. |
| Database Migration and Persistence | Prioritize because data integrity and schema readiness support all transactional behavior. | Persistence behavior was partly covered, but explicit migration validation was not directly automated in the measured baseline. | Partially matched | The priority was correct, but the implemented baseline did not fully cover the planned verification depth. |

Planned-versus-actual conclusion:

- The original prioritization logic was broadly correct.
- The main mismatch was not choosing the wrong modules.
- The main mismatch was that the preserved baseline did not fully achieve the expected level of clean, trustworthy regression coverage in those modules.

## Task 4.2 Key Gaps Between Plan and Reality

The strongest positive result is that the original risk assessment identified the right areas. Authentication, cart, checkout, admin operations, and persistence all turned out to be the areas where failures, coverage concerns, or regression-trust issues were concentrated. This means the risk-based planning logic itself was effective.

The main shortfall was in execution quality rather than prioritization. High-risk automation coverage reached `92%`, which shows the planned strategy was implemented broadly. However, the preserved baseline still had important gaps in coupon removal and explicit migration validation, and several critical-path suites were weakened by setup failures and Playwright fixture misuse. In practice, this meant the automation behaved more like a defect-discovery tool than a fully trusted regression gate.

CI/CD readiness showed a similar pattern. Runtime efficiency matched the plan very well because all module runs were far below the defined CI time threshold. But regression reliability did not match the same level of readiness because the baseline still contained unresolved critical failures and automation defects. Task 2 improved the structure by adding unit tests and missing scenarios, but those changes still require a fresh rerun before they can be counted as measured improvement.

## Task 4.3 Wrong Assumptions

Several planning assumptions did not hold as cleanly as expected.

- Seeded registration and authentication flows were assumed to be stable enough to support downstream suite setup. In reality, registration `500` failures cascaded into cart and order scenarios.
- Broad automation coverage was assumed to be close to a trustworthy regression oracle once the major modules were covered. In reality, coverage breadth did not guarantee clean detectability because some failures were caused by test-harness defects.
- Operational migration handling was assumed to be an acceptable substitute for direct migration validation. In reality, persistence remained a high-risk area and the lack of direct migration checks reduced confidence.

## Task 4.4 Missing Test Scenarios

The comparison between the original plan and actual measured baseline shows several important scenarios were under-covered or absent.

- Coupon removal was missing from the measured baseline even though cart pricing behavior was already identified as high risk.
- Explicit migration validation was missing from the measured baseline even though persistence and seeded readiness were treated as high priority.
- Invalid-user and access-control expansion were not represented strongly enough before Task 2.
- Concurrency or repeated-action behavior was not directly covered before Task 2, even though stateful cart behavior was known to be risk-sensitive.

These missing scenarios did not invalidate the strategy, but they did reduce how completely the strategy was realized in the baseline evidence.

## Task 4.5 Inefficient Automation Design

The preserved evidence also shows automation-design weaknesses that reduced the practical value of the planned strategy.

- Reusing Playwright `request` fixtures from `beforeAll` created false negatives and blocked execution across multiple suites.
- Shared setup dependencies made failures cascade across modules instead of remaining isolated to the feature under test.
- Some failures mixed product behavior problems with harness problems, which lowered detectability and made triage harder.
- Reporter output-folder clashes created artifact-management risk, which is small compared with product defects but still weakens evidence handling.

The result is that the automation was broad enough to surface risk, but not yet cleanly designed enough to act as a stable regression gate without additional cleanup.

## Conclusion

Task 4 shows that the original risk-based plan was mostly right. The highest-priority modules selected in the initial assessment were also the modules where the preserved evidence showed the most meaningful failures, coverage concerns, or trust issues. That means the planning logic itself was sound.

What prevented full success was not wrong prioritization. It was incomplete scenario coverage, fragile automation design, and the gap between broad automation presence and reliable regression quality. Task 2 improved those structural weaknesses, but the overall comparative conclusion remains evidence-based: NovaCart’s QA strategy was directionally correct, while its execution still needs cleanup and rerun validation before the plan can be considered fully realized.
