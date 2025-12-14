const fs = require('fs');
const path = require('path');
const vscode = require('vscode');
const { scanFiles } = require('./fs_scanner');
const { writeLog } = require('./scribe');
const { generateFromModel } = require('./model_pipeline');

async function runWorkspaceProcessing(userPrompt, modelHandle) {
  let logPath = null;
  let outDir = null;

  if (vscode.workspace.workspaceFolders) {
    const ws = vscode.workspace.workspaceFolders[0];
    const root = ws.uri.fsPath;
    logPath = path.join(root, 'genie-log.txt');
    outDir = path.join(root, 'genie_outputs');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    writeLog(logPath, '--- New run initiated ---');
    writeLog(logPath, `User prompt: ${userPrompt}`);

    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Analyzing workspace for documentation',
      cancellable: true
    }, async (progress, token) => {
      try {
        writeLog(logPath, 'Scanning files...');
        const files = await scanFiles(root, logPath);
        vscode.window.showInformationMessage(`Genie found ${files.length} files.`);
        writeLog(logPath, `Files discovered: ${files.length}`);

        const resultFlag = await generateFromModel(modelHandle, files, logPath, userPrompt, outDir, token);
        writeLog(logPath, `Run finished: ${resultFlag}`);
      } catch (err) {
        vscode.window.showErrorMessage('Error during processing: ' + err.message);
        writeLog(logPath, `Error: ${err.message}`);
      }
    });
  } else {
    writeLog(logPath, 'No workspace open.');
    vscode.window.showErrorMessage('Open a workspace to run Genie.');
    return 'NO_WORKSPACE';
  }

  return 'DONE';
}

function registerWorkspaceProcessor(context) {
  context.subscriptions.push(
  vscode.commands.registerCommand('genie.processWorkspace', async (userPrompt, modelHandle) => {
      try {
        return await runWorkspaceProcessing(userPrompt, modelHandle);
      } catch (e) {
        console.error('genie command error', e);
        vscode.window.showErrorMessage('genie command error: ' + e.message);
      }
    })
  );
}

module.exports = { runWorkspaceProcessing, registerWorkspaceProcessor };
