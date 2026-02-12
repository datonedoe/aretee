# Options Basics

## Definitions

What is the Black-Scholes formula used for?
?
Pricing European-style options by modeling the underlying asset price as geometric Brownian motion. Key inputs: spot price (S), strike (K), time to expiry (T), risk-free rate (r), volatility (σ).
<!--SR:!2026-02-15,3,250,5.00,10.00-->

Delta:::The rate of change of option price with respect to changes in the underlying asset price (∂V/∂S)

Gamma:::The rate of change of delta with respect to changes in the underlying price (∂²V/∂S²)

What does Vega measure?
?
The sensitivity of an option's price to changes in implied volatility (∂V/∂σ). Vega is highest for at-the-money options.
<!--SR:!2026-02-15,3,250-->

Put-call parity formula::C - P = S - K·e^(-rT), where C = call price, P = put price, S = spot, K = strike, r = risk-free rate, T = time to expiry

The ==implied volatility== is the volatility value that, when input into Black-Scholes, produces the observed market price of the option.

Theta::The rate of time decay of an option's value (∂V/∂t). Options lose value as expiration approaches, all else equal.<!--SR:!2026-02-20,7,270,4.50,15.00-->

What is the delta of an at-the-money call option approximately equal to?
?
Approximately 0.5 (or 50 deltas). ATM puts have delta ≈ -0.5.

The ==Greeks== are partial derivatives of the option pricing model that measure sensitivity to various factors.

Intrinsic value of a call option::max(S - K, 0), where S is the spot price and K is the strike price<!--SR:!2026-02-18,5,260-->

Rho:::The sensitivity of option price to changes in the risk-free interest rate (∂V/∂r)

What is the volatility smile?
?
The empirical observation that implied volatility varies with strike price, forming a smile or skew shape. Deep OTM puts typically have higher IV than ATM options.

The ==Black-Scholes== model assumes constant volatility, no dividends, and log-normal distribution of returns.

A {{straddle}} is an options strategy involving buying both a call and a put at the same strike and expiration.

What is gamma risk?
?
The risk that delta changes rapidly as the underlying moves, especially near expiration for ATM options. Short gamma positions face increasing losses with large moves.
<!--SR:!2026-02-25,10,280,3.50,20.00-->
