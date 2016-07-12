ace.define("ace/mode/mint_highlight_rules",["require","exports","module","ace/lib/oop","ace/lib/lang","ace/mode/text_highlight_rules"], function(require, exports, module) {
    "use strict";

    var oop = require("../lib/oop");
	var lang = require("../lib/lang");
    var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

    var MintHighlightRules = function() {
        var keywords = "IMPORT|DEVICE|LAYER FLOW|END LAYER|LAYER CONTROL|" +
                       "PORT|NODE|BANK|CHANNEL|3DVALVE|" +
                       "V|H|RIGHT|LEFT|3D|" +
                       "SET X|SET Y|" +
                       "SQUARE CELL TRAP|LONG CELL TRAP|LOGIC ARRAY|CELL TRAP|MUX|" +
                       "from|to|of";

        var keywordMapper = this.createKeywordMapper({
            "keyword": keywords,
        }, "identifier", true);

        this.$rules = {
            "start" : [ {
                token : "comment",
                regex : "#.*$"
            }, {
                token : "comment.start",
                regex : "/#*",
                next : [
                    { token : "comment.end", regex : "\\*/" },
                    { defaultToken : "comment" }
                ]
            }, {
                token : keywordMapper,
                regex : "[a-zA-Z_$][a-zA-Z0-9_$]*\\b"
            }]
        };
        this.normalizeRules();
    };

    oop.inherits(MintHighlightRules, TextHighlightRules);
    exports.MintHighlightRules = MintHighlightRules;
});

ace.define("ace/mode/mint",["require","exports","module","ace/range","ace/lib/oop","ace/mode/text","ace/mode/text_highlight_rules","ace/mode/mint_highlight_rules","ace/mode/matching_brace_outdent","ace/unicode"], function(require, exports, module) {
    "use strict";

    var oop = require("../lib/oop");
// defines the parent mode
    var TextMode = require("./text").Mode;
    var Tokenizer = require("../tokenizer").Tokenizer;
    //var MatchingBraceOutdent = require("./matching_brace_outdent").MatchingBraceOutdent;

// defines the language specific highlighters and folding rules
    var MintHighlightRules = require("./mint_highlight_rules").MintHighlightRules;
    //var MyNewFoldMode = require("./folding/mynew").MyNewFoldMode;

    var Mode = function() {
        // set everything up
        this.HighlightRules = MintHighlightRules;
        //this.$outdent = new MatchingBraceOutdent();
        //this.foldingRules = new MyNewFoldMode();
    };
    oop.inherits(Mode, TextMode);

    (function() {
        // configure comment start/end characters
        this.lineCommentStart = "#";
        //this.blockComment = {start: "/*", end: "*/"};

        // special logic for indent/outdent. 
        // By default ace keeps indentation of previous line
        // this.getNextLineIndent = function(state, line, tab) {
        //     var indent = this.$getIndent(line);
        //     return indent;
        // };
        //
        // this.checkOutdent = function(state, line, input) {
        //     return this.$outdent.checkOutdent(line, input);
        // };
        //
        // this.autoOutdent = function(state, doc, row) {
        //     this.$outdent.autoOutdent(doc, row);
        // };

        // create worker for live syntax checking
        this.createWorker = function(session) {
            var worker = new WorkerClient(["ace"], "ace/mode/mynew_worker", "NewWorker");
            worker.attachToDocument(session.getDocument());
            worker.on("errors", function(e) {
                session.setAnnotations(e.data);
            });
            return worker;
        };

    }).call(Mode.prototype);

    exports.Mode = Mode;
});