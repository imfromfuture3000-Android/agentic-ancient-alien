.PHONY: setup build test deploy scan agent all

setup:
	@chmod +x scripts/*.sh
	@./scripts/setup.sh

build:
	@anchor build

test:
	@anchor test

deploy:
	@chmod +x scripts/deploy-devnet.sh
	@./scripts/deploy-devnet.sh

scan:
	@chmod +x scripts/run-all-scanners.sh
	@./scripts/run-all-scanners.sh

agent:
	@npx ts-node scripts/agent-researcher.ts

all: setup build scan
