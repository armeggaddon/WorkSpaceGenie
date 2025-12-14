
const vscode = require('vscode');
const { registerWorkspaceProcessor } = require('./utils/workflow_runner');

/**
 * @param {vscode.ExtensionContext} ctx
 */
function activate(ctx) {
  registerWorkspaceProcessor(ctx);

  let sessionChat = [];
  let docChat = [];
  let activeHistory = null;

  const participantHandler = async (request, _chatContext, stream, token) => {
    const incoming = request.prompt;
    const modelRef = request.model;
    console.log(`User asked GenieAssistant: ${incoming}`);

    let responseChunks = [];
    let composed = '';

    if (request.command === 'createDocs') {
      let prepared;
      if (docChat.length > 0 && docChat[0].content && docChat[0].content[0].value.includes('You are an orchestrator for doc creation')) {
        prepared = incoming;
      } else {
        prepared = `You are an orchestrator for doc creation. Guide the user to produce a clear prompt for generating documentation. 
        When ready, ask the user to confirm and then reply exactly with ["::GENERATE::","<PROMPT>"]` + "\nuser_input: " + incoming;
      }
      docChat.push(vscode.LanguageModelChatMessage.User(prepared));
      activeHistory = docChat;
    } else {
      sessionChat.push(vscode.LanguageModelChatMessage.User(incoming));
      activeHistory = sessionChat;
    }

    try {
      const modelStream = await modelRef.sendRequest(activeHistory, token);
      for await (const piece of modelStream.text) {
        composed += piece;
        responseChunks.push(piece);
        if (!composed.includes('[')) {
          stream.markdown(piece);
        }
      }

      if (composed.includes('["::GENERATE::"')) {
        const parsed = JSON.parse(composed);
        stream.markdown(`Click to produce documentation for: "${parsed[1]}"`);
        stream.button({
          command: 'genie.processWorkspace',
          title: vscode.l10n.t('Produce Documentation'),
          arguments: [parsed[1], modelRef]
        });
      }

      activeHistory.push(vscode.LanguageModelChatMessage.Assistant(responseChunks));
    } catch (e) {
      console.error(e);
      stream.markdown(`Error: ${e.message}`);
    }
  };

  const participant = vscode.chat.createChatParticipant('genie.assistant', participantHandler);
  participant.iconPath = vscode.Uri.joinPath(ctx.extensionUri, 'images/image.jpg');
  ctx.subscriptions.push(participant);
}

module.exports = { activate };
