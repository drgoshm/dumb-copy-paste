'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");

function activate(context) {
    let dumb = new Dumb();
    let copy = vscode_1.commands.registerTextEditorCommand('dumb.copy', (editor) => {
        dumb.copy(editor);
        vscode_1.commands.executeCommand("editor.action.clipboardCopyAction");
    });
    let cut = vscode_1.commands.registerTextEditorCommand('dumb.cut', (editor) => {
        dumb.copy(editor);
        vscode_1.commands.executeCommand('editor.action.clipboardCutAction');
    });
    let paste = vscode_1.commands.registerTextEditorCommand('dumb.paste', (editor) => {
        if (!dumb.paste(editor))
            vscode_1.commands.executeCommand('editor.action.clipboardPasteAction');
    });
    let clone = vscode_1.commands.registerTextEditorCommand('dumb.clone', (editor) => {
        dumb.clone(editor);
    });
    context.subscriptions.push(dumb);
    context.subscriptions.push(copy);
    context.subscriptions.push(cut);
    context.subscriptions.push(paste);
    context.subscriptions.push(clone);
}
exports.activate = activate;

function deactivate() {}
exports.deactivate = deactivate;
class Dumb {
    constructor() {
        this.hasContent = false;
    }
    static spaces(line, tabSize) {
        let ind = line.match(Dumb.indReg)[1];
        return ind.length + (tabSize - 1) * (ind.split('\t').length - 1);
    }
    clone(editor) {
        let sel = editor.selection;
        if (sel.isEmpty) {
            return;
        }
        let lines = editor.document.getText(sel).split('\n');
        editor.edit((e) => {
            e.insert(sel.start, lines.join('\n') + '\n');
        });
    }
    copy(editor) {
        let sel = editor.selection;
        if (sel.isSingleLine) {
            this.hasContent = false;
            return;
        }
        this.hasContent = true;
        let tabSize = Number(editor.options.tabSize);
        let lines = editor.document.getText(sel).split('\n');
        let blockIndent = 0;
        if (sel.start.character > 0) {
            let lineStart = new vscode_1.Position(sel.start.line, 0);
            let pre = editor.document.getText(new vscode_1.Range(lineStart, sel.start));
            blockIndent = Dumb.spaces(pre, tabSize);
        }
        for (let i = 1, l = lines.length; i < l; i++) {
            let spaces = Dumb.spaces(lines[i], tabSize);
            let ind = spaces - blockIndent;
            if (ind > 0) {
                let _ind = '\t'.repeat(Math.floor(ind / tabSize)) + ' '.repeat(ind % tabSize);
                lines[i] = _ind + lines[i].trim();
            } else {
                lines[i] = lines[i].trim();
            }
        }
        this.lines = lines;
    }
    paste(editor) {
        if (this.hasContent) {
            let sel = editor.selection;
            let tabSize = Number(editor.options.tabSize);
            let insertSp = Boolean(editor.options.insertSpaces);
            let blockIndent = 0;
            if (sel.start.character > 0) {
                let lineStart = new vscode_1.Position(sel.start.line, 0);
                let pre = editor.document.getText(new vscode_1.Range(lineStart, sel.start));
                blockIndent = Dumb.spaces(pre, tabSize);
            }
            let lines = this.lines.slice();
            for (let i = 1, l = lines.length; i < l; i++) {
                let spaces = Dumb.spaces(lines[i], tabSize);
                if (insertSp) {
                    lines[i] = ' '.repeat(blockIndent + spaces) + lines[i].trim();
                } else {
                    let _ind = '\t'.repeat(Math.floor((blockIndent + spaces) / tabSize)) + ' '.repeat((blockIndent + spaces) % tabSize);
                    lines[i] = _ind + lines[i].trim();
                }
            }
            editor.edit((e) => {
                if (!sel.isEmpty)
                    e.delete(sel);
                e.insert(sel.start, lines.join('\n'));
            });
            return true;
        }
        return false;
    }
    dispose() {}
}
Dumb.indReg = /^(\s*)/;
//# sourceMappingURL=extension.js.map