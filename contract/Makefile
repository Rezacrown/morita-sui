SUI = /home/linuxbrew/.linuxbrew/bin/sui

# Detect WSL IP for Windows backend access
WSL_IP = $(shell hostname -I | awk '{print $$1}')

.PHONY: build test localnet-start localnet-stop localnet-faucet localnet-publish localnet-setup localnet-env devnet-publish clean

build:
	$(SUI) move build --build-env testnet

test:
	$(SUI) move test

# ─── Devnet ───

devnet-switch:
	$(SUI) client switch --env devnet

devnet-faucet:
	$(SUI) client faucet

devnet-publish:
	$(SUI) client publish --gas-budget 50000000

# ─── Localnet ───

localnet-start:
	@echo "=== Starting Sui local network ==="
	RUST_LOG="off,sui_node=info" $(SUI) start --force-regenesis --with-faucet &
	@sleep 6
	@echo ""
	@echo "=== WSL IP: $(WSL_IP) ==="
	@echo "Windows backend can connect to: http://$(WSL_IP):9000"
	@echo "Creating 'local' env in Sui CLI..."
	-$(SUI) client new-env --alias local --rpc http://127.0.0.1:9000
	$(SUI) client switch --env local

localnet-faucet:
	$(SUI) client faucet

localnet-publish:
	@echo "=== Publishing to localnet ==="
	$(SUI) client publish --gas-budget 50000000

localnet-test-publish:
	@echo "=== Test publishing (no state saved) ==="
	$(SUI) client test-publish --build-env testnet

localnet-env:
	@echo "=== Localnet connection info ==="
	@echo "WSL IP          : $(WSL_IP)"
	@echo "Sui RPC         : http://$(WSL_IP):9000"
	@echo "Faucet          : http://$(WSL_IP):9123/gas"
	@echo ""
	@echo "For .env.local file:"
	@echo "  NEXT_PUBLIC_SUI_NETWORK=local"
	@echo "  SUI_RPC_URL=http://$(WSL_IP):9000"

localnet-stop:
	@echo "Stopping local Sui network..."
	-pkill -f "sui start" 2>/dev/null || true

localnet-setup: localnet-stop localnet-start localnet-faucet
	@echo "=== Localnet ready! ==="
	@echo "Run 'make localnet-publish' to deploy contracts."

# ─── Clean ───

clean:
	rm -rf build

full-clean: clean
	rm -f Move.lock
