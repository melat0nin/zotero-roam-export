let zre = {};

let isDebug = function() {
    return typeof Zotero != 'undefined' &&
        typeof Zotero.Debug != 'undefined' &&
        Zotero.Debug.enabled;
};

zre.init = function() {
    // let stringBundle = document.getElementById('zoteroroamexport-bundle');
    // if (stringBundle != null) {
    //     this._captchaString = stringBundle.getString('captchaString');
    //     this._citedPrefixString = stringBundle.getString('citedPrefixString');
    // }


    alert('this is a test!');
    // Register the callback in Zotero as an item observer
    let notifierID = Zotero.Notifier.registerObserver(
        this.notifierCallback, ['item']);

    // Unregister callback when the window closes (important to avoid a memory leak)
    window.addEventListener('unload', function(e) {
        Zotero.Notifier.unregisterObserver(notifierID);
    }, false);
};

// so citation counts will be queried for >all< items that are added to zotero!? o.O
// zsc.notifierCallback = {
//     notify: function(event, type, ids, extraData) {
//         if (event == 'add') {
//             zsc.processItems(Zotero.Items.get(ids));
//         }
//     }
// };

zre.hasRequiredFields = function(item) {
    return item.getField('title') &&
        item.getCreators().length > 0;
};

zre.exportItems = function() {
    alert('hello! item');
    Zotero.debug('ITEM EXPORT TEST');
    var items = Zotero.getActiveZoteroPane().getSelectedItems();
    Zotero.debug(JSON.stringify(items));
};

zre.exportCollections = function() {
    alert('hello! collection');
    Zotero.debug('COLLECTION EXPORT TEST');
    var collections = Zotero.getActiveZoteroPane().getSelectedCollection();
    Zotero.debug(JSON.stringify(collections));
};


// if (typeof window !== 'undefined') {
//     window.addEventListener('load', function(e) {
//         Zotero.RoamExport.init();
//     }, false);
// };

//module.exports = Zotero.RoamExport;

//if (typeof window !== 'undefined') {
window.addEventListener('load', function(e) {
    zre.init();
}, false);



// API export for Zotero UI
// Can't imagine those to not exist tbh
if (!window.Zotero) window.Zotero = {};
if (!window.Zotero.RoamExport) window.Zotero.RoamExport = {};
// note sure about any of this
window.Zotero.RoamExport.exportItems = function() {
    zre.exportItems();
};
window.Zotero.RoamExport.exportCollections = function() {
    zre.exportCollections();
};
//}

if (typeof module !== 'undefined') module.exports = RoamExport;
