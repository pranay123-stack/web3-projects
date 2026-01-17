;;; ==========================================================================
;;; Kadena Fungible Token Smart Contract
;;; ==========================================================================
;;; A complete fungible token implementation in PACT language
;;; Features: mint, burn, transfer, balance queries, and admin controls
;;; ==========================================================================

(namespace "free")

;; Define the admin keyset for governance
(define-keyset "free.token-admin-keyset" (read-keyset "token-admin-keyset"))

(module simple-token "free.token-admin-keyset"
  @doc "A simple fungible token implementation on Kadena blockchain"

  ;; ==========================================================================
  ;; Schemas
  ;; ==========================================================================

  (defschema token-schema
    @doc "Schema for token account balances"
    balance:decimal
    guard:guard
  )

  (defschema token-info-schema
    @doc "Schema for token metadata"
    name:string
    symbol:string
    decimals:integer
    total-supply:decimal
  )

  ;; ==========================================================================
  ;; Tables
  ;; ==========================================================================

  (deftable accounts:{token-schema})
  (deftable token-info:{token-info-schema})

  ;; ==========================================================================
  ;; Capabilities
  ;; ==========================================================================

  (defcap GOVERNANCE ()
    @doc "Admin-only capability for governance actions"
    (enforce-guard (keyset-ref-guard "free.token-admin-keyset"))
  )

  (defcap MINT (account:string amount:decimal)
    @doc "Capability to mint new tokens (admin only)"
    (enforce-guard (keyset-ref-guard "free.token-admin-keyset"))
  )

  (defcap BURN (account:string amount:decimal)
    @doc "Capability to burn tokens (admin only)"
    (enforce-guard (keyset-ref-guard "free.token-admin-keyset"))
  )

  (defcap TRANSFER:bool (sender:string receiver:string amount:decimal)
    @doc "Capability for token transfers"
    (enforce (!= sender receiver) "Cannot transfer to same account")
    (enforce (> amount 0.0) "Transfer amount must be positive")
    (with-read accounts sender { "guard" := guard }
      (enforce-guard guard)
    )
  )

  (defcap DEBIT (account:string)
    @doc "Internal capability to debit an account"
    true
  )

  (defcap CREDIT (account:string)
    @doc "Internal capability to credit an account"
    true
  )

  ;; ==========================================================================
  ;; Token Info Functions
  ;; ==========================================================================

  (defun init-token:string (name:string symbol:string decimals:integer)
    @doc "Initialize token metadata (can only be called once)"
    (with-capability (GOVERNANCE)
      (insert token-info "info" {
        "name": name,
        "symbol": symbol,
        "decimals": decimals,
        "total-supply": 0.0
      })
      (format "Token {} ({}) initialized with {} decimals" [name symbol decimals])
    )
  )

  (defun get-token-info:object{token-info-schema} ()
    @doc "Get token metadata"
    (read token-info "info")
  )

  (defun get-name:string ()
    @doc "Get token name"
    (at "name" (read token-info "info"))
  )

  (defun get-symbol:string ()
    @doc "Get token symbol"
    (at "symbol" (read token-info "info"))
  )

  (defun get-decimals:integer ()
    @doc "Get token decimals"
    (at "decimals" (read token-info "info"))
  )

  (defun get-total-supply:decimal ()
    @doc "Get total token supply"
    (at "total-supply" (read token-info "info"))
  )

  ;; ==========================================================================
  ;; Account Functions
  ;; ==========================================================================

  (defun create-account:string (account:string guard:guard)
    @doc "Create a new token account with zero balance"
    (enforce (> (length account) 2) "Account name must be at least 3 characters")
    (insert accounts account {
      "balance": 0.0,
      "guard": guard
    })
    (format "Account {} created" [account])
  )

  (defun get-balance:decimal (account:string)
    @doc "Get the token balance of an account"
    (at "balance" (read accounts account))
  )

  (defun account-exists:bool (account:string)
    @doc "Check if an account exists"
    (with-default-read accounts account
      { "balance": -1.0 }
      { "balance" := balance }
      (!= balance -1.0)
    )
  )

  (defun get-account-details:object{token-schema} (account:string)
    @doc "Get full account details including guard"
    (read accounts account)
  )

  ;; ==========================================================================
  ;; Transfer Functions
  ;; ==========================================================================

  (defun transfer:string (sender:string receiver:string amount:decimal)
    @doc "Transfer tokens from sender to receiver"
    (enforce (!= sender receiver) "Cannot transfer to same account")
    (enforce (> amount 0.0) "Transfer amount must be positive")

    (with-capability (TRANSFER sender receiver amount)
      (with-capability (DEBIT sender)
        (debit sender amount)
      )
      (with-capability (CREDIT receiver)
        (credit receiver amount)
      )
    )
    (format "Transferred {} tokens from {} to {}" [amount sender receiver])
  )

  (defun transfer-create:string (sender:string receiver:string receiver-guard:guard amount:decimal)
    @doc "Transfer tokens, creating receiver account if it doesn't exist"
    (enforce (!= sender receiver) "Cannot transfer to same account")
    (enforce (> amount 0.0) "Transfer amount must be positive")

    (with-capability (TRANSFER sender receiver amount)
      (with-capability (DEBIT sender)
        (debit sender amount)
      )
      (with-capability (CREDIT receiver)
        (credit-create receiver receiver-guard amount)
      )
    )
    (format "Transferred {} tokens from {} to {} (created if new)" [amount sender receiver])
  )

  (defun debit:string (account:string amount:decimal)
    @doc "Internal function to debit an account"
    (require-capability (DEBIT account))
    (with-read accounts account { "balance" := balance }
      (enforce (>= balance amount) "Insufficient balance")
      (update accounts account { "balance": (- balance amount) })
    )
  )

  (defun credit:string (account:string amount:decimal)
    @doc "Internal function to credit an existing account"
    (require-capability (CREDIT account))
    (with-read accounts account { "balance" := balance }
      (update accounts account { "balance": (+ balance amount) })
    )
  )

  (defun credit-create:string (account:string guard:guard amount:decimal)
    @doc "Internal function to credit an account, creating if necessary"
    (require-capability (CREDIT account))
    (with-default-read accounts account
      { "balance": -1.0, "guard": guard }
      { "balance" := balance, "guard" := existing-guard }
      (if (= balance -1.0)
        (insert accounts account {
          "balance": amount,
          "guard": guard
        })
        (update accounts account { "balance": (+ balance amount) })
      )
    )
  )

  ;; ==========================================================================
  ;; Mint and Burn Functions
  ;; ==========================================================================

  (defun mint:string (account:string amount:decimal)
    @doc "Mint new tokens to an account (admin only)"
    (enforce (> amount 0.0) "Mint amount must be positive")

    (with-capability (MINT account amount)
      (with-capability (CREDIT account)
        (with-read accounts account { "balance" := balance }
          (update accounts account { "balance": (+ balance amount) })
        )
      )
      ;; Update total supply
      (with-read token-info "info" { "total-supply" := supply }
        (update token-info "info" { "total-supply": (+ supply amount) })
      )
    )
    (format "Minted {} tokens to {}" [amount account])
  )

  (defun mint-create:string (account:string guard:guard amount:decimal)
    @doc "Mint new tokens to an account, creating it if necessary (admin only)"
    (enforce (> amount 0.0) "Mint amount must be positive")

    (with-capability (MINT account amount)
      (with-capability (CREDIT account)
        (credit-create account guard amount)
      )
      ;; Update total supply
      (with-read token-info "info" { "total-supply" := supply }
        (update token-info "info" { "total-supply": (+ supply amount) })
      )
    )
    (format "Minted {} tokens to {} (created if new)" [amount account])
  )

  (defun burn:string (account:string amount:decimal)
    @doc "Burn tokens from an account (admin only)"
    (enforce (> amount 0.0) "Burn amount must be positive")

    (with-capability (BURN account amount)
      (with-read accounts account { "balance" := balance }
        (enforce (>= balance amount) "Insufficient balance to burn")
        (update accounts account { "balance": (- balance amount) })
      )
      ;; Update total supply
      (with-read token-info "info" { "total-supply" := supply }
        (update token-info "info" { "total-supply": (- supply amount) })
      )
    )
    (format "Burned {} tokens from {}" [amount account])
  )

  ;; ==========================================================================
  ;; Utility Functions
  ;; ==========================================================================

  (defun rotate-guard:string (account:string new-guard:guard)
    @doc "Rotate the guard for an account (requires current guard)"
    (with-read accounts account { "guard" := old-guard }
      (enforce-guard old-guard)
      (update accounts account { "guard": new-guard })
    )
    (format "Guard rotated for account {}" [account])
  )
)

;; ==========================================================================
;; Table Creation (run after module deployment)
;; ==========================================================================

(if (read-msg "init")
  [
    (create-table accounts)
    (create-table token-info)
  ]
  "Tables already initialized"
)
