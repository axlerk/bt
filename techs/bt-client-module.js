/**
 * bt-client-module
 * ================
 * 
 * Склеивает *bt*-файлы по deps'ам с помощью набора `require` в виде `?.bt.client.js`.
 * Предназначен для сборки клиентского BT-кода.
 * Использует модульную обертку.
 * 
 * **Опции**
 * 
 * * *String* **target** — Результирующий таргет. По умолчанию — `?.bt.client.js`.
 * * *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.
 * 
 * **Пример**
 * 
 * ```javascript
 * nodeConfig.addTech(require('bt/techs/bt-client-module'));
 * ```
 */
 var Vow = require('vow'),
    vowFs = require('vow-fs'),
    btClientProcessor = require('../lib/bt-client-processor');

module.exports = require('enb/lib/build-flow').create()
    .name('bt-client-module')
    .target('target', '?.bt.client.js')
    .defineOption('btFile', '')
    .defineOption('dependencies', {})
    .useFileList(['bt.js'])
    .needRebuild(function(cache) {
        this._btFile = this._btFile || 'node_modules/enb-bt/lib/bt.js';
        this._btFile = this.node._root + '/' + this._btFile;
        return cache.needRebuildFile('bt-file', this._btFile);
    })
    .saveCache(function(cache) {
        cache.cacheFileInfo('bt-file', this._btFile);
    })
    .builder(function(btFiles) {
        var node = this.node;
        var dependencies = this._dependencies;
        return Vow.all([
            vowFs.read(this._btFile, 'utf8').then(function(data) {
                return data;
            }),
            Vow.all(btFiles.map(function(file) {
                return vowFs.read(file.fullname, 'utf8').then(function(data) {
                    var relPath = node.relativePath(file.fullname);
                    return '// begin: ' + relPath + '\n' +
                        btClientProcessor.process(data) + '\n' +
                        '// end: ' + relPath + '\n';
                });
            })).then(function(sr) {
                return sr.join('\n');
            })
        ]).spread(function(btEngineSource, inputSources) {
            return btClientProcessor.buildModule(btEngineSource, inputSources, dependencies);
        });
    })
    .createTech();
