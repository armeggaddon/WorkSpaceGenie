const fs = require('fs');
const path = require('path');
const vscode = require('vscode');
const { writeLog } = require('./scribe');

async function generateFromModel(modelHandle, fileList, logPath, userPrompt, outputDir, token) {
  let idx = 0;
  for (const filePath of fileList) {
    idx++;
    if (token && token.isCancellationRequested) {
      writeLog(logPath, 'Run cancelled by user');
      return 'CANCELLED';
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const base = path.basename(filePath, path.extname(filePath));

    try {
      const prompt = [
        vscode.LanguageModelChatMessage.User(`${userPrompt} for the file:\n\n${content}`)
      ];

      const response = await modelHandle.sendRequest(prompt, {});

      let outPath = path.join(outputDir, `${base}.md`);
      let version = 1;
      while (fs.existsSync(outPath)) {
        outPath = path.join(outputDir, `${base}_v${version}.md`);
        version++;
      }

      const ws = fs.createWriteStream(outPath, { flags: 'w' });
      for await (const chunk of response.text) {
        ws.write(chunk);
      }
      ws.end();

      vscode.window.showInformationMessage(`${base} documented (${idx}/${fileList.length})`);
      writeLog(logPath, `${base} -> ${path.basename(outPath)}`);
    } catch (err) {
      console.error('model error', err);
      writeLog(logPath, `Error processing ${base}: ${err.message}`);
    }
  }

  return 'OK';
}

module.exports = { generateFromModel };
