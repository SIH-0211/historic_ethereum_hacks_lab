# Delegatecall Storage Collision Diagram

When a smart contract uses `delegatecall`, it borrows the logic (bytecode) of the target contract but executes it entirely within the **calling contract's storage context**.

## The Parity #1 Vulnerability

### Storage Layout of Proxy (WalletVulnerable)
| Slot | Variable |
|------|----------------|
| 0    | `owner`        |
| 1    | `libraryAddress` |

### Storage Layout of Library (WalletLibraryVulnerable)
| Slot | Variable |
|------|----------------|
| 0    | `owner`        |

### Attack Flow Diagram

```text
Attacker (EOA)
  │
  │ call: initWallet(AttackerAddress)
  ▼
WalletVulnerable (Proxy)
  │ Fallback function triggered
  │ delegatecall(WalletLibraryVulnerable, "initWallet(AttackerAddress)")
  │
  ├──► Executes logic from WalletLibraryVulnerable
  │    Code: owner = _owner;
  │
  ├──► Context: Storage of WalletVulnerable
  │    Slot 0 (Proxy's owner) is overwritten with AttackerAddress
  ▼
Proxy's state updated: owner = AttackerAddress
```

Because the proxy did not initialize the `owner` properly or block re-initialization, the attacker leverages `delegatecall` to overwrite the proxy's `owner` state variable (Slot 0) with their own address. This gives the attacker full control over the proxy's funds.
