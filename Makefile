# Makefile for subtask-navigation-for-asana
# [Created with AI: Claude Code with Opus 4.6]

NAME := subtask-navigation-for-asana
FILES := '**/*.{md,css,js}'

.PHONY: help
help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

.PHONY: install-hooks
install-hooks: ## Install pre-commit git hooks
	uvx pre-commit install

.PHONY: format
format: ## Auto-format Markdown, CSS, and JavaScript with Prettier
	npx --yes prettier --write $(FILES)

.PHONY: lint
lint: ## Check formatting with Prettier
	npx --yes prettier --check $(FILES)

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

.PHONY: bump-version
bump-version: ## Bump version to current America/Los_Angeles timestamp
	bash scripts/bump-version.sh

.PHONY: package
package: validate ## Create .zip for Chrome Web Store upload
	@rm -f $(NAME).zip
	zip -r $(NAME).zip manifest.json content.js content.css icons/ LICENSE PRIVACY.md
	@echo "Created $(NAME).zip"

.PHONY: release
release: package ## Tag, create GitHub release, and upload .zip
	$(eval VERSION := $(shell node -p "require('./manifest.json').version"))
	git tag -a v$(VERSION) -m "Release v$(VERSION)"
	git push origin v$(VERSION)
	gh release create v$(VERSION) $(NAME).zip --title "v$(VERSION)" --generate-notes

.PHONY: clean
clean: ## Remove build artifacts
	rm -f $(NAME).zip
