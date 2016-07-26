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

    // Visual display of the menu letting the user know if TabEx
    // is turned on or off
    function menuHandler(){
        if(command.getChecked()){
            command.setChecked(false);
            return;
        }
        
        command.setChecked(true);  
        var tabex = handleTabEx();
    }   
    
    // Sets the keydown listener, gathers line of text when
    // fired. If keydown is a tab, search the line and move
    // cursor if required.
    function handleTabEx(){
        // get editor & document
        var editor   = EditorManager.getFocusedEditor(),
            document = DocumentManager.getCurrentDocument();
            
        // start keydown event listener
        editor.on("keydown",function(be, e, ke){
            // keycode 9 === "tab"
            // If the menu item is not checked, tab should
            // behave normaly. This conditional allows us
            // to 'turn off' TabEx.
            if(ke.keyCode == 9 && command.getChecked()){ 
                
                var cursorPos = editor.getCursorPos();
                var currentLineOfText = document.getLine(cursorPos["line"]);
                
                // This is all useless if we are already at the end of the line!
                if(cursorPos["ch"] === currentLineOfText.length) {
                    return 0;
                }

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
        
        // Lines with white spaces only will cause brackets to crash if we
        // don't check the string first
        if(!found) return 0;

        // Finds the last occurance of (, [, or { in the input string
        while(prergx.exec(inputString)){
            preIndex = prergx.lastIndex;
        }

        // Finds the first occurance of ), ], or } in the string,
        // AFTER the current cursorPosition
        while(postrgx.lastIndex <= cursorPosition) {
            postrgx.exec(inputString);
            postIndex = postrgx.lastIndex;
        }

        // Return the index if the cursor is between the (), {}, or []
        // If not, we assume the user wants "tab" to insert a tab, so
        // return 0
        if(preIndex <= cursorPosition && postIndex >= cursorPosition) 
            return postIndex;
        
        return 0;
    }

});
