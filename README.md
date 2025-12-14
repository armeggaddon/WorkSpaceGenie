
# Workspace Genie

Workspace Genie is a lightweight Visual Studio Code extension that helps generate documentation for codebases using a language model. It scans files in the open workspace, sends contextual prompts to a model, and writes the model-produced documentation into workspace output files.

**Primary goals:**
- Make it easy to generate per-file documentation from natural-language prompts.
- Provide a clear demo of integrating VS Code chat participants and language models.
- Keep the implementation concise and easy to adapt for demos or forks.

**Highlights**
- Workspace scanning and file discovery: `utils/fs_scanner.js`.
- Model invocation and streaming capture: `utils/model_pipeline.js`.
- Lightweight logging: `utils/scribe.js` (append-only timestamped log).
- VS Code command and chat participant: `genie.processWorkspace` and `genie.assistant`.

Chat Participant API
--------------------

Genie demonstrates a simple Chat Participant API implemented in `extension.js`. The extension registers a chat participant that can be invoked from VS Code's chat UI. The participant listens for short trigger commands (messages that start with `@genie`) and responds by running the same document-processing pipeline the command palette action uses. Two example chat triggers supported by the extension are:

- `@genie` : Starts an interactive chat with Workspace Genie and uses the prompt + current workspace context to generate documentation or suggestions.
- `@genie /createDocs` : Explicitly instructs Genie to scan the workspace and create documentation files (same behavior as `genie.processWorkspace`).

Because the chat participant is a thin adapter over the existing `model_pipeline` and `fs_scanner` utilities, the same pattern can be reused for other conversational features (for example: code reviewers, changelog writers, test-case generators, or refactoring assistants). To add a new capability, implement a new command or chat trigger, reuse the existing context-collection helpers, and provide a different instruction template to the model.

Reusability and extending functionality
--------------------------------------

The architecture intentionally separates responsibilities into small modules (`fs_scanner.js`, `model_pipeline.js`, `scribe.js`) and a lightweight extension entry (`extension.js`). This makes it straightforward to reuse the chat participant integration for additional features:

- **New chat commands**: Add additional `@genie` triggers that map to different templates (e.g., `@genie /review`, `@genie /generateTests`).
- **Different output flows**: Swap or extend `model_pipeline` to support other output formats (issues, unit tests, PR descriptions) while keeping the chat interface identical.
- **Composable prompts**: Create templates that combine file context, recent commit messages, or test failures before sending to the model.

Testing note
------------

The current implementation and automated tests were validated only with GPT-family models (models compatible with GPT-style prompting and streaming). If you use non-GPT model providers or vendor-specific APIs, you may need to adapt the `model_pipeline.js` integration and prompt/response handling to match those providers' conventions.

**Requirements**
- Node.js (v16+)
- Visual Studio Code (recent stable release)

Distribution
------------

- The extension is also available on the Visual Studio Marketplace (search for "Workspace Genie").

Installation

```powershell
npm install
```

Usage (quickstart)

1. Open the repository folder in VS Code.
2. Run the command palette action: **Process Workspace for Documentation** (`genie.processWorkspace`).
3. Enter a prompt describing the documentation you want (e.g., "Create a short developer-facing README and usage examples").
4. Generated documentation files are written to the `genie_outputs/` folder at the workspace root. Workflow events and errors are appended to `genie-log.txt`.

Notes on behavior
- The extension keeps chat history in memory and builds a small prompt that includes the target file's content before sending it to the configured language model.
- Outputs are versioned: if `genie_outputs/<filename>.md` already exists, the code will create `_<n>` suffixes to avoid overwriting.

File structure (important files)

```
workspace-genie/
├── extension.js                # VS Code extension entry (chat participant + command)
├── utils/
│   ├── fs_scanner.js          # Recursively find workspace files
│   ├── model_pipeline.js      # Send file contents to model and save outputs
│   └── scribe.js              # Timestamped logging helper
├── images/
│   └── genie_banner.svg       # Banner for social/marketing
├── scripts/
│   ├── GENIE_BANNER_EXPORT_INSTRUCTIONS.txt
│   └── merge_banner.js        # (optional) script to composite images using sharp
├── test/
│   └── extension.test.js      # Simple, local-run tests
├── package.json
├── README.md
└── LICENSE
```

Development

- Run lint:

```powershell
npm run lint
```

- Run the local test script (no VS Code integration required):

```powershell
npm test
```

Exporting the banner image

If you need PNG/JPEG versions of the banner, see `scripts/GENIE_BANNER_EXPORT_INSTRUCTIONS.txt`. Common commands use ImageMagick, Inkscape, or Node + `sharp`. Example (ImageMagick):

```powershell
# convert SVG to PNG (1200x627)
magick convert images\genie_banner.svg -background none -resize 1200x627 images\genie_banner.png
```

Security & privacy

- The extension reads files from the workspace and sends content to a configured language model. Do not use it on sensitive or private repositories without reviewing the model provider's data handling policy.

Contributing

- Open issues or PRs with focused changes. Keep changes small and explain your motivation.
- If you add features that call external services, document required environment variables and auth steps.

License

This project is available under the MIT License — see the `LICENSE` file.

Contact / attribution

If you'd like me to prepare a short LinkedIn post and packaging (zip + images) for you to share, I can produce that next.

Example prompts
----------------
Here are a few sample prompts to try with Workspace Genie:

- "Create a short README for this file explaining purpose, usage, and example code snippets."
- "Summarize the responsibilities of the functions in this file and list potential edge-cases."
- "Generate unit test ideas for the following code and include one example test."
- "Write a high-level architecture summary for this project suitable for new contributors."
- "Produce a short changelog entry describing recent refactors and why they were done."

Troubleshooting
---------------

- "No models found" or model selection errors:
	- Ensure you have configured a language model provider in your VS Code environment. Some VS Code language model APIs require vendor-specific setup.

- Network or authentication errors when calling the model:
	- Check network access and any API keys required by your model provider; avoid exposing sensitive keys in the workspace.

- Permission denied when writing to `genie_outputs/`:
	- Ensure your workspace is writeable and that no external process is locking files. On Windows, run VS Code as the same user.

- Large repositories are slow to scan:
	- Exclude large directories (node_modules, build folders) from your workspace or adapt `utils/fs_scanner.js` to skip additional paths.

- Tests fail locally:
	- Run `npm run lint` first to catch code-style issues. The included test is a minimal sanity check; more robust integration tests require a configured VS Code test environment.


````
