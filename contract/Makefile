SUI = /home/linuxbrew/.linuxbrew/bin/sui

.PHONY: build test localnet-start localnet-stop localnet-publish localnet-faucet localnet-setup devnet-publish clean

build:
	$(SUI) move build --build-env testnet

test:
	$(SUI) move test

devnet-switch:
	$(SUI) client switch --env devnet

devnet-faucet:
	$(SUI) client faucet

devnet-publish:
	$(SUI) client publish --gas-budget 50000000

localnet-start:
	@echo "Starting Sui local network..."
	$(SUI) start --force-regenesis --with-faucet &
	@sleep 5
	$(SUI) client new-env --alias localnet --rpc http://127.0.0.1:9000 || true
	$(SUI) client switch --env localnet

localnet-faucet:
	$(SUI) client faucet

localnet-publish:
	$(SUI) client publish --gas-budget 50000000

localnet-stop:
	@echo "Stopping local Sui network..."
	-pkill -f "sui start" 2>/dev/null || true

localnet-setup: localnet-stop localnet-start localnet-faucet

clean:
	rm -rf build

full-clean: clean
	rm -f Move.lock
