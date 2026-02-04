.PHONY: dev fix-electron

dev:
	turbo dev

fix-electron:
	./scripts/fix-electron.sh
