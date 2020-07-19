const typemap = {
    artwork: "Illustration",
    audioRecording: "Recording",
    bill: "Legislation",
    blogPost: "Blog post",
    book: "Book",
    bookSection: "Chapter",
    "case": "Legal case",
    computerProgram: "Data",
    conferencePaper: "Conference paper",
    email: "Letter",
    encyclopediaArticle: "Encyclopaedia article",
    film: "Film",
    forumPost: "Forum post",
    hearing: "Hearing",
    instantMessage: "Instant message",
    interview: "Interview",
    journalArticle: "Article",
    letter: "Letter",
    magazineArticle: "Magazine article",
    manuscript: "Manuscript",
    map: "Image",
    newspaperArticle: "Newspaper article",
    patent: "Patent",
    podcast: "Podcast",
    presentation: "Presentation",
    radioBroadcast: "Radio broadcast",
    report: "Report",
    statute: "Legislation",
    thesis: "Thesis",
    tvBroadcast: "TV broadcast",
    videoRecording: "Recording",
    webpage: "Webpage",
}


Zotero.RoamExport = Zotero.RoamExport || new class {

    getPref(pref) {
        return Zotero.Prefs.get('extensions.roamexport.' + pref, true);
    }

    setPref(pref, value) {        
        Zotero.Prefs.set('extensions.roamexport.' + pref, value, true);
    }

    getBBTCiteKey(item) {
        if (typeof Zotero.BetterBibTeX === 'object' && Zotero.BetterBibTeX !== null) {
            var bbtItem = Zotero.BetterBibTeX.KeyManager.get(item.getField('id')), 
                bbtCiteKey = bbtItem.citekey;
            return bbtCiteKey;
        }
        return false;
    }

    getItemTitle(item) {
        var title, bbtCiteKey = this.getBBTCiteKey(item);
        if (this.getPref('citekey_as_title') && bbtCiteKey) { 
            title = `@${bbtCiteKey}`; 
        } else if (this.getItemType(item) == "Legal case") {
            title = item.getField('caseName');
        } else if (this.getItemType(item) == "Legislation") {
            title = item.getField('nameOfAct');
        } else {
            title = item.getField('title');
        }
        return title;
    }

    getItemType(item) {
        var zoteroType = Zotero.ItemTypes.getName(item.getField("itemTypeID"));
        if (item.url && (item.url.includes("arxiv") || item.url.includes("ssrn"))) {
            return "Preprint";
        } else {
            return typemap[zoteroType];
        }
    }

    getItemCreators(item) {
        var creators = item.getCreators(),
            creatorTypesObj = {},
            creatorTypesArray = [];
        for (let creator of creators) {
            let creatorTypeString = Zotero.CreatorTypes.getName(creator.creatorTypeID);
            creatorTypeString = `${Zotero.Utilities.Internal.camelToTitleCase(creatorTypeString)}(s)`;
            if (creatorTypesObj[creatorTypeString] === undefined) creatorTypesObj[creatorTypeString] = [];
            let thisCreatorString = "";
            if (creator.firstName) thisCreatorString += creator.firstName;
            if (creator.lastName) thisCreatorString += " " + creator.lastName;
            thisCreatorString = `[[${Zotero.Utilities.trim(thisCreatorString)}]]`;
            creatorTypesObj[creatorTypeString].push(thisCreatorString);
        }
        for (let [creatorType, thisCreatorTypeArray] of Object.entries(creatorTypesObj)) {
            creatorTypesArray.push({
                "string": `${creatorType}:: ${thisCreatorTypeArray.join(", ")}`
            });
        }
        return creatorTypesArray;        
    }

    getItemRelatedItems(item) {
        var relatedItemUris = item.getRelations()["dc:relation"],
            relatedItemsArray = [];

        for (let uri of relatedItemUris) {
            var itemID = Zotero.URI.getURIItemID(uri),
                relatedItem = Zotero.Items.get(itemID);
            relatedItemsArray.push({
                "string": `[[${relatedItem.getField("title")}]]`
            });
        }
        return relatedItemsArray;
    }

    getItemCollections(item) {
        var collectionIds = item.getCollections(),
            collectionsArray = [],
            recursiveCollections = this.getPref('recursive_collection_topics');
        for (let id of collectionIds) {
            var collection = Zotero.Collections.get(id);
            collectionsArray.push(`[[${collection.name}]]`);
            if (recursiveCollections) {
                while (collection.parentID) {
                    var parentCollection = Zotero.Collections.get(collection.parentID);
                    collectionsArray.push(`[[${parentCollection.name}]]`);
                    collection = parentCollection;
                }
            }
        }
        collectionsArray = [...new Set(collectionsArray)];
        return collectionsArray;
    }

    getItemMetadata(item) {
        var metadata = {},
            itemType = this.getItemType(item),
            itemLinks = [],
            itemAbstract = item.getField('abstractNote'),
            localURL = `[Local library](zotero://select/library/items/${item.key})`,
            cloudURL = `[Web library](https://www.zotero.org/users/${Zotero.Users.getCurrentUserID()}/items/${item.key})`,
            itemLinks = [localURL, cloudURL],
            itemCreators = this.getItemCreators(item),
            bbtCiteKey = this.getBBTCiteKey(item),
            citekeyAsTitle = this.getPref('citekey_as_title');
        metadata.string = "Metadata::";
        metadata.heading = 2;
        metadata.children = [];
        
        if (itemCreators.length > 0) {
            for (let creatorType of itemCreators) {
                metadata.children.push(creatorType);
            }
        }
        if (citekeyAsTitle && bbtCiteKey) {
            metadata.children.push({
                "string": `Title:: ${item.getField('title')}`
            });    
        }
        if (itemType == 'Chapter') {
            var bookTitle;
            if (bookTitle = item.getField('bookTitle')) {
                metadata.children.push({
                    "string": `Book title:: [[${bookTitle}]]`
                });
            }
        }
        metadata.children.push({
            "string": `Type:: [[${itemType}]]`
        });
        if (itemType == 'Article') {
            var pubTitle;
            if (pubTitle = item.getField('publicationTitle')) {
                metadata.children.push({
                    "string": `Publication:: [[${pubTitle}]]`
                });
            }
        }
        if (itemAbstract && itemAbstract.length > 1) {
            metadata.children.push({
                "string": "Abstract::",
                "children": [{"string": itemAbstract}]
            });    
        }
        metadata.children.push({
            "string": `Topics:: ${this.getItemCollections(item).join(", ")}`
        });
        if (item.getField("date")) {
            metadata.children.push({
                "string": `Date:: ${item.getField("year")}`
            });
        }
        if (item.getField("dateAdded")) {
            const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            var d = new Date(item.getField("dateAdded"));
            var nth = function(d) {
                if (d > 3 && d < 21) return 'th';
                switch (d % 10) {
                    case 1:  return "st";
                    case 2:  return "nd";
                    case 3:  return "rd";
                    default: return "th";
                }
            }
            var roamDateAdded = `${(month[d.getMonth()])} ${d.getDate()}${nth(d.getDate())}, ${d.getFullYear()}`;
            metadata.children.push({
                "string": `Date added:: [[${roamDateAdded}]]`
            });
        }
        if (bbtCiteKey) {
            metadata.children.push({
                "string": `Citekey:: ${bbtCiteKey}`
            });
        }
        if (item.getAttachments().length > 0) {
            var attachments = Zotero.Items.get(item.getAttachments()),
                attachmentLinks = [];
            for (let attachment of attachments) {
                let attachmentType = attachment.attachmentContentType;
                if (attachmentType == "application/pdf" || attachmentType == "application/epub+zip") {
                    let attName = attachment._displayTitle, attExt = attachment.attachmentFilename.split('.').pop();
                    if (attName.length > 30) attName = `${attName.substr(0, 25)}....${attExt}`;
                    if (attachment.attachmentLinkMode == 2) attName += " \u{1f517}";
                    let mimeURI = (attachmentType == "application/pdf") ? "open-pdf" : "select";
                    let attString = `[${attName}](zotero://${mimeURI}/library/items/${attachment.key})`;
                    attachmentLinks.push(attString);
                }
            }
            itemLinks.push(attachmentLinks.join(", "));
        }
        metadata.children.push({
            "string": `Zotero links:: ${itemLinks.join(", ")}`
        });
        if (item.getField("url")) {
            var itemUrl = item.getField("url");
            metadata.children.push({
                "string": `URL:: [${itemUrl}](${itemUrl})`
            });
        }
        var itemTags = item.getTags();
        itemTags.push({"tag":"ZoteroImport"}); // Always include #ZoteroImport tag
        metadata.children.push({
            "string": "Tags:: " + itemTags.map(o => `#[[${o.tag}]]`).join(", ")
        });
        if (item.relatedItems.length > 0) {
            metadata.children.push({
                "string": "Related::",
                "children": this.getItemRelatedItems(item)
            });
        }
        return metadata;
    }

    getItemNotes(item) {
        var notes = {},
            itemNotes = Zotero.Items.get(item.getNotes()),
            domParser = Components.classes["@mozilla.org/xmlextras/domparser;1"]
                .createInstance(Components.interfaces.nsIDOMParser),
            mapObj = {"<p>":"","</p>":"","<strong>":"**","</strong>":"**","<b>":"**","</b>":"**","<u>":"### ","</u>":"","<em>":"__","</em>":"__",
                "<blockquote>":"> ","</blockquote>":"","<br><br>":"\n\n"},
            re = new RegExp(Object.keys(mapObj).join("|"),"gi"),
            indentTagAsChild = this.getPref('indent_tag_as_child');

        notes.string = "Notes::";
        notes.heading = 2;
        notes.children = [];

        for (let note of itemNotes) {
            var fullDomNoteBody = domParser.parseFromString(note.getNote(), "text/html").body,
                fullDomNote = fullDomNoteBody.childNodes, // The note's child paragraphs
                thisNoteObject = {},
                noteParasArray = [];
            thisNoteObject.string = `**${note.getNoteTitle()}**`; // Make the first line the note's parent

            for (let i=0; i < fullDomNote.length; i++) { // First remove empty paragraphs
                var thisPara = fullDomNote[i];
                if (thisPara.nodeType != 1) fullDomNoteBody.removeChild(thisPara);
            }
            for (let i=0; i < fullDomNote.length; i++) {
                var para = fullDomNote[i];
                if (para.innerHTML) {
                    noteParasArray[i] = {};
                    for (let link of para.getElementsByTagName('a')) { // Convert html links to markdown
                        link.outerHTML = `[${link.text}](${link.href})`;
                    }
                    if (this.getPref('convert_underline_to_heading')) {
                        for (let underline of para.getElementsByTagName('u')) { // Convert html links to markdown
                            underline.outerHTML = `**${underline.textContent}**`;
                            noteParasArray[i].heading = 3;
                        }
                    }  
                    var parsedInner = para.innerHTML.replace(re, function(matched){
                      return mapObj[matched];
                    });
                    para.innerHTML = parsedInner;
                    if (para.outerHTML.startsWith("<li>")) { para.innerHTML = `- ${para.innerHTML}`; } // TODO: inelegant!
                    if (para.outerHTML.startsWith("<ol>")) { para.innerHTML = `1. ${para.innerHTML}`; }
                    
                    if (indentTagAsChild && indentTagAsChild.length > 0 && i > 0) {
                        var prevParaIndex = i-1; 
                        if (para.outerHTML.startsWith(indentTagAsChild)) { 
                            noteParasArray[prevParaIndex].children = [{ "string": para.innerHTML }];
                            noteParasArray.splice(i,1); // Remove object temporarily instantiated for this paragraph 
                            continue;
                        }
                    }
                    noteParasArray[i].string = para.textContent;
                }
            }
            noteParasArray.splice(0, 1); // Remove note title (already stored)
            noteParasArray = noteParasArray.filter(Boolean); // Remove any empty array items
            thisNoteObject.children = noteParasArray;
            notes.children.push(thisNoteObject);
        }
        return notes;
    }

    gatherItemData(item) { // Get individual item's data
        var roamItem = {},
            itemChildren = [];
        roamItem.title = this.getItemTitle(item);
        var metadata = this.getItemMetadata(item); // Get item metadata
        itemChildren.push(metadata);
        if (item.getNotes().length) { // Get notes if there
            var notes = this.getItemNotes(item);
            itemChildren.push(notes);
        }
        roamItem.children = itemChildren;
        roamItem["edit-time"] = Date.parse(item.getField("dateModified")) / 1000;
        return roamItem;
    }

    getAllItemsData(items) {
        var allItemsData = [];
        for (let item of items) {
            let roamItem;
            if (roamItem = this.gatherItemData(item)) {
                allItemsData.push(roamItem);
            };
        };
        return allItemsData;
    }

    async exportItems() {
        await Zotero.Schema.schemaUpdatePromise;
        var items = Zotero.getActiveZoteroPane().getSelectedItems();
        var allItemsData = this.getAllItemsData(items);
        if (allItemsData.length) {
            await this.writeExport(allItemsData);
        };
    }

    async exportCollections() {
        await Zotero.Schema.schemaUpdatePromise;
        var collection = Zotero.getActiveZoteroPane().getSelectedCollection();
        var items = collection.getChildItems();
        var allItemsData = this.getAllItemsData(items);
        if (allItemsData.length) {
            await this.writeExport(allItemsData);
        }
    }

    async writeExport(data) {
        await Zotero.Schema.schemaUpdatePromise;
        var FilePicker = require('zotero/filePicker').default;
        var fp = new FilePicker();
        fp.init(window, "Save Roam export", fp.modeSave);
        fp.appendFilter("Roam JSON", "*.json");
        fp.defaultString = "roam-export.json";
        var rv = await fp.show();
        if (rv == fp.returnOK || rv == fp.returnReplace) {
            let outputFile = fp.file;
            if (outputFile.split('.').pop().toLowerCase() != "json") {
                outputFile += ".json";
            }
            Zotero.File.putContentsAsync(outputFile, JSON.stringify(data));
        }
    }

    // async helper to log errors
    run(method, ...args) {
        this[method].apply(this, args).catch(err => {
            Zotero.debug(err)
        })
    }
};
