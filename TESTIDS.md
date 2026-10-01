# Test id appendix

`data-testid` values the app uses that SPEC §4 does not list. Same convention:
`{area}-{object}-{action}`, kebab-case, unique per page.

| `data-testid`       | Page     | Purpose                                                                                 |
| ------------------- | -------- | --------------------------------------------------------------------------------------- |
| `checkout-region`   | Checkout | State / region input; SPEC §4 lists the other address fields but a US address needs one |
| `checkout-sign-in`  | Checkout | "Sign in" link offered to guests                                                        |
| `cart-promo-remove` | Cart     | Removes an applied promo code                                                           |
