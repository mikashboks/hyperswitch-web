# MiKashBoks clear-language and interface guide

**Standard ID:** MKB-CLUI · **Version:** 1.1.0 · **Adopted:** 22 November 2026

**Status:** adopted user direction for MiKashBoks design, copy, implementation and review. This is a standard, not a claim that existing screens comply or that candidate wording has been locally validated. Plain, respectful adult English is the default.

**Canonical source:** repository `mikashboks/namk`, `docs/standards/CLEAR_LANGUAGE_INTERFACE_GUIDE.md`. Other repositories carry byte-identical snapshots with adjacent `CLEAR_LANGUAGE_PROVENANCE.json`; edit the canonical source, never a snapshot. Section 8 explains distribution. A snapshot is sufficient in a standalone checkout; no parent directory or Mac path is required.

## 1. One-page mandatory standard

**Users must understand what they can do, what will happen to their money, and what to do next.** Apply this checklist to new or changed customer journeys, messages, labels, support instructions and financial-state contracts. For unrelated infrastructure work, retain it as context; it does not require an invented UI change.

- [ ] Give each screen one main purpose and a familiar action label. Use one idea per sentence and the same term for the same meaning.
- [ ] Use respectful adult language. Never equate limited schooling, English reading, numeracy or phone experience with low intelligence, or assume all Sierra Leonean customers have the same needs.
- [ ] State the real action: recording a cash payment changes a ledger; sending money moves funds. A saved record is not a completed payment.
- [ ] Before financial commitment, show amount, recipient/destination, funding source, fee, total leaving, timing and restrictions. Provide a real way to check and change details or go back. Keep principal, interest, fees and total loan obligation distinct.
- [ ] Match every status claim to authoritative evidence for that exact payment and attempt. Request received, pending, sent, received, failed, reversed and saved offline are different states.
- [ ] If money status is unknown, offer a check of the existing payment and caution against paying again. Never infer no debit, completion or a refund from a timeout or generic error. Do not offer a generic payment retry.
- [ ] Show money available to withdraw separately from total holdings and locked/reserved amounts. Do not present estimates, credit limits, account counts or unfunded entitlements as available cash.
- [ ] Explain technical terms without changing their meaning. Do not promise safety, instant completion, guaranteed returns, loan approval or recovery without verified support.
- [ ] Keep screens readable: space and group related items, label icons, preserve readable text size and accessible controls. Never hide fees, risks or conditions to meet a word or line limit.
- [ ] Identify the credential: MiKashBoks PIN versus AfriMoney PIN. Explain the actual next step and where it happens. Do not ask for a provider PIN in a MiKashBoks field or a support conversation.
- [ ] Use the approved product currency convention and verify displayed, spoken and entered amounts. Test old/new Leone confusion. Do not invent a legal notation, conversion or new currency policy.
- [ ] Test realistic tasks and ask users to explain the money leaving, destination, timing and next step. Resolve observed safety-critical misunderstandings before release. Record provisional wording and evidence gaps honestly.

Review triggers, not rigid or research-proven limits: buttons usually **2–5 words**, headings **3–7 words**, supporting text **1–2 short sentences**. A clear one-word action or a longer necessary disclosure can be correct. Financial completeness and legibility take priority.

## 2. Approved terminology by meaning

These terms retain the existing NAMK `docs/COPY_GLOSSARY.md` product vocabulary where meaning is unchanged. This portable table is the starting point when that repository is absent. Product names use their approved casing; actions and ordinary headings use sentence case. Input synonyms and stored identifiers are compatibility contracts, not display copy: do not delete or rename them to satisfy a vocabulary check.

| Meaning | Use | Boundary / evidence status |
| --- | --- | --- |
| Personal savings product | Personal Savings | Existing product name; generic container is its own name, then “plan”, or “cashbox” when counting. Do not call every container a bank account. |
| Personal savings tiers | Interest+; Anytime | Existing names. “Interest Plus” may explain the name. The name is not a promise of a current rate or unrestricted withdrawal. |
| Group product | Osusu; “savings group” in explanations | Existing brand; explain the actual ROSCA/VSLA rules rather than treating every group as the same product. |
| Buying through savings | Save to Buy; its named plan | Existing product name; distinguish savings, purchase, credit, merchant payment and goods delivery. |
| Money hub and counts | My Money; “3 cashboxes” | Existing vocabulary. A count must be labelled as a count, with money shown separately. |
| Adding real savings | Save money | Existing action, only when it actually adds savings. A receipt such as “You saved {amount}” requires confirmed credit to that savings destination. “Deposit” may be needed in a receipt or explanation. |
| Withdrawing funds | Withdraw | Existing approved short label. “Withdraw money” is a provisional fuller alternative for testing, only for a withdrawal; never use it for loan repayment, transfer or recording cash. |
| ROSCA / VSLA actions | Contribute; Payout; Buy shares; Share out | Existing domain terms. Explain whose money moves, when and under which group rules. Do not replace all of them with “Save money”. |
| Recording cash already handed over | Record cash payment; Payment record saved | Proposed conditional wording. State who paid whom and what was recorded. No implication that MiKashBoks moved the cash. |
| Recording business sales | Record sales | Keep the established lane and unresolved product decision. A sales record is not automatically savings or loan qualification. Do not silently relabel it “Save money”. |
| Total and usable savings | Total saved; To use now; Locked till {date} | Existing savings labels. “To use now” must mean the current amount actually available for the offered action, subject to shown fee/limits; separately identify reservations. A provisional “Available to withdraw” explainer may clarify. Use “Total balance” for a genuine non-savings total. |
| Interest and earnings | interest; earnings | Earnings is an umbrella including applicable interest, rewards and referrals. Explain whether amounts are estimated, accrued, paid or withdrawable. Do not substitute “profit” for interest or imply that interest or earnings are guaranteed. |
| Borrowing | Loan; Pay loan; You owe; Paid back | Existing terms. “Qualify” describes criteria, not approval. State principal, interest, fees, total, due dates and repayment conditions. |
| Loan checks | loan readiness | Existing loan-side wording. Trust Level 2 is a minimum check to apply for a loan; Trust Level and Trust Points do not set your loan score, amount, price, or approval, and an estimate or check is not an offer or approval. |
| Trust programme | Trust Level; Trust Points; Level {n} | Existing programme names. Trust Level 2 is the minimum check to apply for a loan; do not describe Trust Level or Trust Points as a credit score, loan approval, or money that can be withdrawn. |
| Activity | Activity | Existing history label. Explain a specific financial transaction in the detail; the technical word is not banned where its exact meaning is needed. |
| MiKashBoks credential | MiKashBoks PIN | Qualified form of existing money PIN (shared by supported USSD/WhatsApp flows). “PIN” alone only when the provider cannot be confused. Android login password remains a different credential. |
| Provider credential | AfriMoney PIN | Only on the verified AfriMoney approval surface. Explain the transition; never describe it as a MiKashBoks PIN. |
| Payment rail / wallet | mobile money; AfriMoney; Orange Money | Existing provider names. “Wallet” means the mobile-money wallet, not all MiKashBoks holdings. |
| Group timing | Round; Payout; cycle | Existing terms; a cycle is one round for each member. A payout turn is not evidence money has been received. |
| Group versus referral invitations | Invitations / Invites for group joins; Invite friends (Invite customers for agents) for referrals; referral code | Existing distinction; keep the recipient and purpose clear. |
| Programme and settings names | Weekly Draw; entries; Settings | Existing names. Entries are not Trust Points, guaranteed winnings or withdrawable cash. |
| Identity process | Confirm your identity | Provisional rewrite of “Complete KYC” when that is the actual task. Explain the required document/action; do not imply approval before verification finishes. Preserve KYC/KYB in technical or legal material with an explanation. |
| Group share price | Price of one share | Provisional rewrite of “Share price” for the defined group unit; preserve the group calculation and rules. |
| Waiting / errors | State-specific wording in section 4 | Generic “Working on it” and “Something went wrong. Try again soon.” do not establish a payment state. Financial uncertainty always uses the status-check path. |

“Provisional” means a testable alternative, not approved local vocabulary or permission to rename a product. Explain unfamiliar financial concepts with an accurate, relevant example whose figures are clearly illustrative. Do not silently change legal, accounting, contractual or backend meanings.

## 3. Screen and message templates

All placeholders below must come from the verified product flow; they are not invented fees, dates, support contacts or promises. Remove a control from a template if it does not exist and provide an implemented alternative. Do not ship bracketed placeholders.

**Choose / enter:** purpose heading → one question or action → labelled choices/input → brief needed help → Back / Help. For example: “Choose a savings plan” and the actual plan names; then “How much do you want to save?” Keep the selected destination visible when money is entered.

**Review before money moves:**

```text
Check your payment
Amount: {amount and currency}
To: {verified name, destination and useful identifier}
From: {funding source and useful identifier}
Fee: {verified fee, including zero only when verified}
Total leaving: {verified total debit}
When: {verified timing or clearly labelled estimate}
Conditions: {relevant limits, locks, cancellation/recovery conditions}
Actions: {specific commitment action} / Change details / Back / Help
```

Verify the arithmetic and fee basis. If a fee is deducted from the amount, separately show what the recipient will receive and the total debit. Show each applicable charge and who pays it; do not imply `amount + fee` if the actual calculation differs. Loan acceptance also needs amount borrowed, net disbursement, interest basis/rate/period, fees, total owed, payment schedule and material conditions. A quote must not claim disbursement.

**Record cash already paid:** title “Record cash payment” → payer, cash recipient, amount, date and purpose → “This records cash already paid. It does not send money.” → “Save payment record” / Change details. Use “Payment record saved” only after a durable ledger write; identify a local-only save explicitly. “No money was sent by this step” is valid only when the verified step cannot initiate a payment; it says nothing about another payment attempt.

**Success:** exact completed action → verified amount and destination → actual timing/status/reference → implemented next step/help. For example, “{amount} received in {plan}” requires confirmed destination credit, not just provider acceptance.

**Error or uncertainty:** what is known → what remains unknown → safe next action → help with a non-sensitive payment reference. Keep entered details where supported. A failed form validation can request correction; uncertain money movement cannot request a fresh payment.

| Before | Safer candidate after | Only when / limits |
| --- | --- | --- |
| Complete KYC | Confirm your identity | Actual identity-confirmation step; next required action remains explicit. Provisional. |
| Share price | Price of one share | Defined group share, not an investment-market price. Provisional. |
| Money In | Save money | Real savings action. Use “Record cash payment” for a ledger-only action. |
| Money Out | Withdraw | Actual withdrawal. Use the specific action for transfer, purchase or repayment. |
| Data saved | Payment record saved | Verified durable ledger record. Use the offline wording in section 4 for device-only storage. |
| Payment failed. Try again. | We cannot confirm this payment yet. Check its status before paying again. | Unknown outcome; “Check payment status” must inspect the existing attempt, not create another. |
| Replies stay read-only until you tap a button | To {actual action}, choose {actual control}. You can check the details before confirming. | Only if the control starts that review path; do not imply every typed message is read-only if it can start a flow. |
| Looks like you're stuck | We could not finish this step. {safe next action} | Explain whether the draft is retained and preserve uncertain-payment recovery. Do not blame the user or promise a reset completed. |
| Your Balances / Your Balances / 3 | My Money / 3 cashboxes / {separate labelled money totals} | Count and amounts are verified and clearly separated; do not show unavailable funds as cash. |

These are illustrative candidates, not a new live UI audit or bulk replacement list. A wording change must preserve parsers, voice/typed input, in-flight drafts, translation keys, title matchers and accessibility names through the existing channel workflow.

## 4. Exact financial-state wording

Use the evidence for the **same payment, original reference, attempt, direction, amount and destination**. The authoritative backend/provider contract defines the state; generic transport success, HTTP 200, a queue acknowledgement or a local record does not. Do not create a new status map in copy code.

| Verified state / evidence gate | Wording pattern | Required next action / forbidden inference |
| --- | --- | --- |
| Request durably accepted, processing outcome not yet known | “Payment request received. We have not confirmed the payment yet.” | Show actual reference and status-check/help route. Not “Money received” or “Payment complete”. |
| Known pending / being checked | “Your payment is still being checked.” | Offer the existing payment status and the verified next step. Do not pay again while it is unresolved. No invented completion time. |
| Sender-side transfer confirmed, destination receipt not confirmed | “{amount} sent to {destination}. Receipt is not confirmed yet.” | Only if the contract proves funds were sent; otherwise use pending. Do not imply usable funds at the destination. |
| Destination credit confirmed | “{amount} received in {destination}.” | Display the verified amount/reference; separately show available-to-withdraw if relevant. “You saved {amount}” only for confirmed savings credit. |
| Confirmed terminal failure | “This payment failed.” | State a verified reason if useful. Failure alone does not prove no debit or refund. Explain known debit/recovery status separately. Retry only after the backend's exact-attempt retry contract establishes it is safe. |
| Reversal confirmed in records, return/availability not confirmed | “This payment was reversed. We have not confirmed the money is available in {original source} yet.” | Keep a status/help route. If return is verified, state the verified returned amount and destination; explain separately any fee not returned. Never promise an automatic refund date without evidence. |
| Unknown outcome / network timeout | “We cannot confirm this payment yet. Check its status before paying again.” | “Check payment status” reads the original attempt; offer support if checks remain unavailable. No “No money left your wallet”, “Failed”, “Refunded” or generic “Try again”. |
| Record saved only on this device while offline | “Payment record saved on this phone. It has not synced yet.” | Only after verified durable device storage. Say “This step records cash; it does not send money” only for a ledger-only flow. Show actual sync/recovery action; no implication a financial instruction was sent. |
| Financial instruction queued offline, if a product supports it | “Payment instruction saved on this phone. It has not been sent yet.” | Use only after proving no dispatch and actual queue semantics. Explain when/how it may send and how to cancel if supported. Never confuse it with a cash ledger record. |

No source-grounded retry exception may be widened by a simpler label. No `NOT_FOUND` result creates general retry permission. Preserve only the exception already implemented for the exact lane, with all original-reference, timing, single-dispatch, identity and accounting safeguards. The current NAMK retry audit describes a guarded direct legacy collection exception; Hyperswitch collections/payouts and direct legacy payouts retain their documented reconciliation/hold rules. Router `NOT_FOUND`/404 responses and inactive library helpers never authorize resubmission. A timeout, generic 404, bare code or wrong reference supplies no authoritative exact-attempt evidence. `STATUSCODE=TP` remains pending under the shared contract even if other provider fields say success. Verify the current recovery contract and lane-specific retry audit before implementing any recovery wording; this guide grants no retry, payment or release authorization.

**Balance and obligation rules:** distinguish total holdings, available-to-withdraw, locked/reserved funds and pending changes. Do not infer the available amount by subtracting incomplete projections. Show the applicable fee and limits before confirmation. For loans, “You owe {total}” must not conflate principal with interest and fees, and “Paid back” requires the correct settled repayment/remaining-obligation state. A payroll estimate, benefit, guarantee, credit limit or loan offer is not a funded withdrawable balance. Do not use “safe”, “instant”, “guaranteed” or “approved” as reassurance unless the precise claim is substantiated and applicable.

## 5. Low-density design rules

- One main purpose and one primary action per screen. Group amount, destination and costs so they can be checked together; avoid duplicated headings, repeated recaps and competing banners.
- Keep text readable on the smallest supported phone and at supported text enlargement. Use spacing and labelled controls; do not shrink type, remove useful labels or truncate financial facts to fit. Icons and colour supplement words, never replace them.
- Put the next action near the information needed to choose it. Use clear Help, Back and Change details actions; explain a genuine irreversible consequence before commitment.
- Reveal secondary explanation progressively, while keeping fees, risks, restrictions, financial review and essential recovery instructions visible before commitment. Filtering invalid choices does not replace explaining the relevant conditions on the review screen.
- Preserve the existing WhatsApp one-message-per-turn, button/list and message-budget rules. Treat its approximate five-body-line target as a review trigger. Use a supported staged review when a full financial recap will not fit; the final commitment must retain access to the complete current details and changes. Never silently omit required information or split sends in breach of the channel contract.
- For USSD, measure the actual rendered budget including navigation and test session interruption and resume. If a safe complete review cannot fit the supported interaction, raise a design blocker rather than abbreviating away meaning. Approved short forms still require observed understanding.
- Keep financial meaning, rights and conditions consistent across Android, USSD, WhatsApp, web/merchant tools and SMS. Adapt interaction to actual channel capability: a feature-phone USSD session does not acquire audio controls because WhatsApp supports voice notes. Existing parser/intent parity gates still apply where implemented.
- Distinguish guidance from commitment. Text or voice may start a supported flow, but users must see the actual review and authorization required by that flow. Screen reader labels, focus and status announcements must communicate the same outcome as visible text.

## 6. Local language and number rules

Design for people in Freetown and rural Sierra Leone with different reading, numeracy, language and phone experience. Recruit and observe those differences instead of treating location or schooling as a proxy for ability. Financial-literacy or English-reading scores do not substitute for understanding a real task.

Plain English remains the product-output default under existing guidance. Build on the existing Krio help collection and input support; use native-speaker review before approving any Krio translation, pronunciation or new output mode. The existing glossary's 3 August 2026 English-output decision is not silently lifted. Test whether additional languages or optional audio help are useful; these are research directions, not authorized feature changes or validated translations. Audio must be optional and discreet on shared phones, with equivalent readable help and no automatic reading of private financial information.

Use one product/compliance-approved currency display convention for the relevant journey and preserve its unit consistently across entry, review, receipt and spoken help. This guide does not choose a new legal notation. Inspect current formatters and product/compliance direction; escalate unresolved conflicts before shipping. Existing NAMK integrations translate operational `SLL` and downstream `SLE` codes without multiplying or dividing amounts under the documented MiKashBoks integration convention. This is an internal code contract, **not** a legal statement that historical old and new Leones have equal value, nor permission to convert amounts at display time.

Test realistic spoken and typed amounts, separators, zeros, decimals, share counts, totals and old/new Leone references. Repeat the interpreted amount and destination before commitment; require correction/confirmation of ambiguity rather than guessing the unit. Clearly label percentages and their period, estimates versus actual figures, and dates/times with the applicable timezone when needed. Explain a percentage with a clearly illustrative amount only after verifying the calculation and terms. Do not copy historical marketing rates, help examples, USSD codes or support contacts as current facts without checking them.

## 7. User testing and release checklist

- [ ] Use realistic test tasks for saving, recording cash, checking usable money, paying fees, borrowing/repayment and recovery as applicable. Include wrong recipient, uncertain network status, interruption and old/new Leone ambiguity. **No real financial transactions in research**; use controlled prototypes or safe test environments with clearly fictional money.
- [ ] Include Freetown and rural sites and people with different reading, numeracy, language and phone experience, including assisted and shared-phone use where relevant. Record the sample and limitations; do not claim national representation.
- [ ] Ask users to show what they would do and explain: “How much will leave?”, “Where will it go?”, “When can it be used?” and “What would you do next?” Observe wrong turns, pauses, repeated attempts and help needed. Do not rely on “Do you understand?” or a satisfaction score.
- [ ] Verify the distinction between a ledger record and money movement, total and available money, request and success, failure and returned funds, MiKashBoks PIN and provider PIN, loan checks and approval. Test uncertain payment recovery without encouraging a duplicate payment.
- [ ] Record the exact build/channel, wording, language, state fixtures, task outcome, misunderstandings, assistance and limitations. Separate unaided understanding from success after coaching. Mark every untested wording alternative provisional.
- [ ] Resolve observed safety-critical misunderstandings before release: wrong amount/unit/recipient, hidden charge or restriction, mistaken completion/refund, duplicate-payment encouragement, credential confusion or false loan approval. Retest the changed journey. Route unresolved issues to the responsible product/financial owner as release blockers.
- [ ] Review smallest-screen layout, text enlargement, labels, focus, interruption/resume and available input modes. Run the repository's existing meaningful state/parser/accessibility checks where the implementation changes; a readability score alone is insufficient.
- [ ] Verify current fees, timing, terms, status contracts and support routes with the responsible owners. Record their review and remaining uncertainty. Do not describe a source/prototype check as deployed or field-validated behavior.

## 8. Ownership and enforcement in reviews

The user's adoption makes this standard mandatory. The lead for each affected task identifies the responsible product/design owner, financial/backend owner, language reviewer and QA/research owner as needed; these are required responsibilities, not a claim that named staff have accepted a new appointment. Product/design owns meaning and usability; the financial/backend owner verifies amounts, states and promises; native speakers review local-language material; QA/research records observed understanding. Agents implement and review within their authorized scope and report gaps.

Design reviews check purpose, terms, financial recap and recovery. Code/agent reviews check authoritative state mapping, totals/availability, copy keys and supported inputs against sections 1–7. In the existing PR/review format, record: **standard version; affected journeys/states; evidence for financial claims; user-test/native-language status; checks run; unresolved blockers; responsible follow-up owner**. Simple documentation-only or infrastructure tasks can state the relevant limited scope. Do not invent user validation or require unrelated product changes to close such a task. Do not add automated hooks or new release approval mechanisms under this documentation task.

**Authority and existing guidance.** This guide governs financial truth, clarity and observed understanding across MiKashBoks. Existing product names in NAMK `docs/COPY_GLOSSARY.md`, channel mechanics, compatibility exceptions and repository safety/ownership/release rules remain in force. For customer-facing financial states, this guide's conservative status/duplicate-payment rules take priority over generic error/retry text. Complete financial disclosure and legibility take priority over density targets. The qualified PIN distinction refines the glossary's generic PIN label. Preserve the English-output default while testing local help. If a broader product, contractual or compliance conflict remains, record the exact conflict and obtain the responsible decision; do not guess or treat this guide as proof of current backend behavior. No documentation integration authorizes a product release, money movement, credential access, deployment, blanket approval change or Git operation.

**Canonical version and distribution.** Maintain the source in `mikashboks/namk` at the path above and increment the version/date for an adopted revision. Its adjacent `CLEAR_LANGUAGE_PROVENANCE.json` records the exact SHA-256, canonical repository/path, version and distribution role; copies carry the same content hash and a snapshot role. The canonical path plus hash identifies uncommitted local content without inventing a commit SHA. Review the source once, regenerate snapshots as one coordinated documentation change, and verify every copy and entrypoint. Never maintain a second authored guide or edit a snapshot locally. A standalone consumer proposes changes to the canonical repository, then imports the reviewed guide and provenance together; until an update is available, it follows its pinned snapshot and reports drift.

When the shared workspace is available, run the canonical maintenance helper from NAMK:

```sh
python3 docs/standards/sync_clear_language.py --workspace /path/to/MiKashBoks --check
# After an authorized canonical documentation update:
python3 docs/standards/sync_clear_language.py --workspace /path/to/MiKashBoks --sync
```

The adjacent distribution manifest inventories repository-relative destinations and actual agent entrypoints. `--check` is read-only; `--sync` changes only its managed documentation blocks and generated guide/provenance files, preserves unrelated instruction text and refuses foreign destination content. Read the manifest and respect current ownership before sync. It does not commit, push, deploy or install startup hooks. In a separately checked-out consumer without NAMK, import the reviewed guide byte-for-byte and its snapshot provenance from an authorized source, verify SHA-256 with `shasum -a 256`, then include those files and the existing instruction links in that repository's reviewed revision. Do not insert an absolute Mac path as the only route.

Local files make the standard discoverable to fresh agents on this Mac. Other machines, hosted agents and new clones receive it only when the relevant guide, provenance and entrypoint changes are included in their selected Git revisions. A local installation, version number or hash does not imply a commit, push, remote propagation, automatic reload by an already-running agent or proof that every agent complied.

**Evidence and provenance — reviewed 16 October 2026.** Sources inform this adopted standard; they do not validate every proposed term or establish current live functionality/pricing. Internal source dates below are Drive modification dates, not new publication dates. No customer records or credentials are reproduced here.

| Foundation | Date / provenance | Use and limits |
| --- | --- | --- |
| [MiKashBoks Consumer Protection Policy](https://docs.google.com/document/d/19BHp_EAFHSnLyUPAlNiwETtt_i0kff0PK3vHlqXONI0/edit) | Modified 10 July 2026; read through connected Drive on 16 October | Understandable information, minimal jargon, upfront fees, concise terms, step-by-step help and dignity. This is company policy, not an independent legal-compliance opinion. |
| [Marketing Playbook v2](https://docs.google.com/document/d/1ZmbMGLfrV2pMYGdzNsACriKndMCfU9oh/edit) | Modified 19 August 2026; read 16 October | Respectful everyday-saver framing and concrete amounts/dates. Krio drafts require native review; examples/rates and campaign promises are not verified current pricing or product guarantees. |
| [UNDP closeout and transition report](https://docs.google.com/document/d/1GgCqp5XGoLhuHSADLfGFzY3NgB9JU0Yj/edit) | Modified 7 September 2026; read 16 October | Describes Android, USSD, supported Miki text/voice tasks, assisted onboarding and unfamiliar financial terms. Staff estimated 3–4 contacts per first-time borrower; not systematically timed or a population estimate. |
| [WhatsApp Natural Language Processing Check](https://docs.google.com/document/d/1M-Wy0iW6pdrxoxQqvhhQsvvEK2_vPnBw0Xnw24LpSPo/edit) | Modified 8 June 2026; read 16 October | Historical test examples include duplicate headings, ambiguous money labels and implementation jargon. Not a fresh live audit or proof every cited issue still exists. |
| [Krio help collection](https://intercom.help/mikashboks/en/collections/5472448-mkb-help-materials-krio), [cash contribution records](https://intercom.help/mikashboks/en/articles/10038683-recording-savings-and-social-fund-contributions), [USSD contributions](https://intercom.help/mikashboks/en/articles/10040040-making-a-contribution-to-a-mikashboks-digital-osusu-group-ussd) | Opened 16 October; the two articles are dated 24 October 2024 | Existing local help; illustrates ledger/payment and PIN boundaries. Historical labels, codes and operational steps need current verification. |
| [CGAP smartphone-interface principles](https://www.cgap.org/blog/power-of-smartphone-interfaces-for-mobile-money) | Supplied in the approved research handoff; page retrieval unavailable in this implementation pass | Background reference, not independently reverified here or a source for numerical thresholds. |
| [GOV.UK writing for user interfaces](https://www.gov.uk/service-manual/design/writing-for-user-interfaces) | Opened 16 October; page last updated 16 April 2018 | Short direct content, intuitive names, one idea per sentence and labelled information. Adapt to MiKashBoks tasks; no claim of local validation. |
| [W3C clear-content guidance](https://www.w3.org/WAI/WCAG2/supplemental/objectives/o3-clear-content/) and [financial error-prevention explanation](https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html) | Opened 16 October | Cognitive advice is supplemental, not itself a WCAG requirement. SC 3.3.4 is a Level AA criterion with reversible, checked or confirmed alternatives; its Understanding page is informative. This guide is not a WCAG-conformance certification. |
| [GSMA / Orange Sierra Leone digital-skills study](https://www.gsma.com/solutions-and-impact/connectivity-for-good/mobile-for-development/wp-content/uploads/2024/10/Delivering-digital-skills-training-for-impact-Learnings-and-insights-from-Sierra-Leone.pdf) | October 2024 report; opened 16 October 2026 | Qualitative training evidence; not nationally representative, a measure of intelligence or proof of comprehension of MiKashBoks screens. |
| NAMK copy glossary and current agent rules | Existing glossary established 10 August 2026; local files inspected 16 October | Product vocabulary, channel constraints, conservative AfriMoney evidence and internal currency-code boundaries. Source inspection is not verification of deployed behavior. |

Version history: **1.0.0 — 16 October 2026:** adopted cross-project standard, portable checklist/glossary, state wording, templates, testing responsibilities and snapshot distribution. Provisional terms remain unvalidated. **1.1.0 — 22 November 2026:** clarified that Trust Level 2 is a minimum check to apply for a loan, while Trust Level and Trust Points do not set loan score, amount, price, or approval, and are not money that can be withdrawn.
