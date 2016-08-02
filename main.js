/**********************************************
*
*  Tabex allows you to exit an auto-complete
*  bracket, braces or parenthesis by pressing 
*  the tab key. The cursor is placed outside 
*  the closing brace, bracket or parentheses. 
*
*  7/18/2016 by Paul Thompson
*  mailto.prt@gmail.com
*  github.com/paritho
*
**********************************************/

define(function(require, exports, module){
    "use strict";
    
    var CommandManager  = brackets.getModule("command/CommandManager"),
        EditorManager   = brackets.getModule("editor/EditorManager"),
        DocumentManager = brackets.getModule("document/DocumentManager"),
        Menus           = brackets.getModule("command/Menus");
    
    var COMMAND_ID = "tabex.startTabEx";    
    CommandManager.register("Use TabEx", COMMAND_ID, menuHandler);
    var command = CommandManager.get(COMMAND_ID);
    
    var menu = Menus.getMenu(Menus.AppMenuBar.NAVIGATE_MENU);
    menu.addMenuItem(COMMAND_ID,"Ctrl-Shift-X");
    
    // So that TabEx will work when switching editors or files
    // we listen for the activeEditorChange. If TabEx is active,
    // start
    var editor, tabex;
    EditorManager.on('activeEditorChange',function(e,gf,lf){
        editor = gf;
        if(command.getChecked()) tabex = startTabEx();
    });
    
    // Visual display of the menu letting the user know if TabEx
    // is turned on or off
    function menuHandler(){
        if(command.getChecked()){
            command.setChecked(false);
            return;
        }
            command.setChecked(true);  
            tabex = startTabEx();
    }   

    // Sets the keydown listener, gathers line of text when
    // fired. If keydown is a tab, search the line and move
    // cursor if required.
    function startTabEx(){
        // get editor & document
        var document = DocumentManager.getCurrentDocument();
        
        // start keydown event listener
        editor.on("keydown",function(be, e, ke){
            // keycode 9 === "tab"
            if(ke.keyCode == 9 && command.getChecked()){ 

                var cursorPos = editor.getCursorPos();
                var currentLineOfText = document.getLine(cursorPos["line"]);
                
                // If cursor is at EOL, do nothing
                if(cursorPos["ch"] === currentLineOfText.length) return;

                var newCursorPos = searchStringAndReturnIndex(currentLineOfText,cursorPos["ch"]);
                
                // If tab is pressed inside (), {}, or [], we want to disable
                // the default nature of the tab key and move the cursor.
                // This ensures that pressing tab on a line that has (), {}, 
                // or [] in it will insert "tab" if the cursor isn't in the
                // middle
                if(newCursorPos){
                    ke.preventDefault();
                    editor.setCursorPos(cursorPos["line"],newCursorPos);  
                }
            }   
        });
        
    }

    // Searches the input string for () {} and []. If found and
    // cursor position is between, return an index outside the set.
    // This index is used to "jump" the cursor outside of auto
    // complete brackets, braces, and parenthesis. 
    function searchStringAndReturnIndex(inputString,cursorPosition){
        var prergx = /\(|\{|\[/g,
            postrgx = /\)|\}|\]/g,
            preIndex = 0,
            postIndex = 0,
            found = inputString.match(prergx) && inputString.match(postrgx);
            
        if(!found) return 0;
        
        postrgx.exec(inputString);
        while(postrgx.lastIndex <= cursorPosition) {
            postrgx.exec(inputString);
        }   
        postIndex = postrgx.lastIndex;
        
        while(prergx.exec(inputString)){
            preIndex = prergx.lastIndex;
            if(prergx.lastIndex >= cursorPosition) break;
        }   
        
        // Return the index if the cursor is between the (), {}, or []
        // If not, we assume the user wants "tab" to insert a tab, so
        // return 0
        if(preIndex <= cursorPosition && postIndex >= cursorPosition) 
            return postIndex;
             
        return 0;
    }

});
