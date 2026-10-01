# Test id appendix

`data-testid` values the app uses that SPEC §4 does not list. Same convention:
`{area}-{object}-{action}`, kebab-case, unique per page.

| `data-testid`                                                       | Page          | Purpose                                                                                 |
| ------------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------- |
| `checkout-region`                                                   | Checkout      | State / region input; SPEC §4 lists the other address fields but a US address needs one |
| `checkout-sign-in`                                                  | Checkout      | "Sign in" link offered to guests                                                        |
| `cart-promo-remove`                                                 | Cart          | Removes an applied promo code                                                           |
| `account-email`, `account-name`, `account-phone`                    | Profile       | Profile form fields (SPEC §4 lists only `account-save`)                                 |
| `account-address-{label\|address1\|address2\|city\|region\|postal}` | Profile       | New address form fields                                                                 |
| `account-address-default-{id}`, `account-address-remove-{id}`       | Profile       | Per-address actions                                                                     |
| `account-order-{number}`                                            | Order history | Link to an order                                                                        |
| `order-refund-reason`                                               | Order detail  | Reason textarea beside `order-refund-request`                                           |
