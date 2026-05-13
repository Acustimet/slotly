# Slotly — License Compliance Memo

**Date:** 2026-05-13  
**Prepared by:** SkunkCTO  
**Status:** CLEAR — no action required beyond keeping copyright notice

---

## Substrate: cal.diy (MIT License)

Slotly is built on [cal.diy](https://github.com/calcom/cal.diy), which is licensed under the **MIT License**.

Original copyright notice:
> Copyright (c) 2023 Cal.com, Inc.

---

## MIT License obligations

The MIT License has two requirements:

1. **Keep the copyright notice** — the LICENSE file in our repo satisfies this. ✅
2. **Keep the license text** — LICENSE file is present and unmodified. ✅

That is all. There are **no** source disclosure requirements, **no** network-use (AGPL §13) obligations, and **no** copyleft provisions.

---

## What this means for Slotly

| Concern | Status |
|---|---|
| Can we charge for the SaaS? | Yes, MIT allows commercial use |
| Do we need to publish our modifications? | No, MIT is permissive |
| Can we keep our Lemon Squeezy / Stripe integration private? | Yes |
| Do we need a source code link in the footer? | No (we added one voluntarily as a trust signal, not a legal requirement) |
| AGPL §13 network-use source disclosure? | Not applicable — substrate is MIT |

---

## Actions required

- [x] Keep `LICENSE` file unmodified in repo root (already done)
- [x] Keep copyright notice intact (already done)
- [ ] CEO sign-off on this memo (see SON-12)

---

## Note on AGPL variants

cal.com (the enterprise product) is AGPL-3.0. cal.diy is a separate MIT-licensed repository. We forked cal.diy, not cal.com. If we ever pull in code from the AGPL cal.com repo, that code would carry AGPL obligations and must be evaluated separately. Current codebase has no AGPL code.

---

*Prepared for SON-12: MIT compliance review. Escalation ESC-2 resolved.*
