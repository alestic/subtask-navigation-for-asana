# Makefile for subtask-navigation-for-asana
# [Created with AI: Claude Code with Opus 4.6]

NAME := subtask-navigation-for-asana

.PHONY: help
help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

.PHONY: lint
lint: lint-md lint-css lint-js ## Run all linters and format checkers

.PHONY: lint-md
lint-md: ## Check Markdown formatting with Prettier
	npx --yes prettier --check '**/*.md'

.PHONY: lint-css
lint-css: ## Check CSS formatting with Prettier
	npx --yes prettier --check '**/*.css'

.PHONY: lint-js
lint-js: ## Check JavaScript formatting with Prettier
	npx --yes prettier --check '**/*.js'

.PHONY: format
format: format-md format-css format-js ## Run all formatters

.PHONY: format-md
format-md: ## Format Markdown files with Prettier
	npx --yes prettier --write '**/*.md'

.PHONY: format-css
format-css: ## Format CSS files with Prettier
	npx --yes prettier --write '**/*.css'

.PHONY: format-js
format-js: ## Format JavaScript files with Prettier
	npx --yes prettier --write '**/*.js'

.PHONY: validate
validate: ## Validate manifest.json structure
	@node -e " \
	  const m = require('./manifest.json'); \
	  const required = ['manifest_version', 'name', 'version', 'description', 'content_scripts']; \
	  const missing = required.filter(k => !m[k]); \
	  if (missing.length) { console.error('Missing keys:', missing.join(', ')); process.exit(1); } \
	  if (m.manifest_version !== 3) { console.error('Expected manifest_version 3'); process.exit(1); } \
	  if (!/^\d+(\.\d+){0,3}$$/.test(m.version)) { console.error('Invalid version:', m.version); process.exit(1); } \
	  console.log('manifest.json OK (v' + m.version + ')'); \
	"

.PHONY: package
package: validate ## Create .zip for Chrome Web Store upload
	@rm -f $(NAME).zip
	zip -r $(NAME).zip manifest.json content.js content.css LICENSE PRIVACY.md
	@echo "Created $(NAME).zip"

.PHONY: bump-version
bump-version: ## Bump version to current America/Los_Angeles timestamp
	bash scripts/bump-version.sh

.PHONY: clean
clean: ## Remove build artifacts
	rm -f $(NAME).zip

.PHONY: install-hooks
install-hooks: ## Install pre-commit git hooks
	uvx pre-commit install
