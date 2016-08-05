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
        Menus           = brackets.getModule("command/Menus"),
        App             = brackets.getModule('utils/AppInit'),
        PreferManager   = brackets.getModule("preferences/PreferencesManager");
    
    var COMMAND_ID = "tabex.startTabEx";    
    CommandManager.register("Use TabEx", COMMAND_ID, menuHandler);
    var command = CommandManager.get(COMMAND_ID);
    
    var menu = Menus.getMenu(Menus.AppMenuBar.NAVIGATE_MENU);
    menu.addMenuItem(COMMAND_ID,"Ctrl-Shift-X");
    
    var prefs = PreferManager.getExtensionPrefs("tabex");
        prefs.definePreference("enabled","boolean", false);

    var editor;
    // So that TabEx will work when switching editors or files
    // we listen for the activeEditorChange. 
    EditorManager.on('activeEditorChange',function(e,gf,lf){
        editor = gf;
        var s = startTabEx();
    });
    
    // Visual display of the menu letting the user know if TabEx
    // is turned on or off
    function menuHandler(){
        if(command.getChecked()){
            command.setChecked(false);
            prefs.set('enabled',false);
            return;
        }
            command.setChecked(true);  
            prefs.set('enabled',true);
            var st = startTabEx();
    }    
 
    // Sets the keydown listener, gathers line of text when
    // fired. If keydown is a tab, search the line and move
    // cursor if required.
    function startTabEx(){
        
        if(!editor) editor = EditorManager.getFocusedEditor();
        
        // start keydown event listener. be = BracketsEvent,
        // e = Editor, ke = KeyboardEvent
        editor.on("keydown",function(be, e, ke){

            // keycode 9 === "tab"
            if(ke.which == 9 && command.getChecked()){ 

                var cursorPos = e.getCursorPos();
                var currentLineOfText = e.document.getLine(cursorPos["line"]);

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
                    e.setCursorPos(cursorPos["line"],newCursorPos);  
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
        
        var leftrgx = /\(|\{|\[/g,
            rightrgx = /\)|\}|\]/g,
            lResult = leftrgx.exec(inputString),
            rResult = rightrgx.exec(inputString);
        
        if(lResult.index > cursorPosition) return 0;
        
        var leftPos = cursorPosition;
        while(!inputString.charAt(leftPos).match(leftrgx)) {
            --leftPos;
        }
      
        while(rResult.index < cursorPosition){
            rResult = rightrgx.exec(inputString);
        }
        var rightPos = rightrgx.lastIndex;
        
        if(leftPos < cursorPosition && rightPos >= cursorPosition) 
            return rightPos;

        return 0;
    }
   
    App.appReady(function(){    
        // we have to wait for the editor to be loaded before turning on
        // tabex
        if(prefs.get('enabled')) setTimeout(menuHandler,500);
    });
    
    // save the preferences before end
    prefs.save();
    
});
