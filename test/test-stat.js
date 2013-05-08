var mfs = require('../'),
   assert = require('assert'),
   fs = require('fs'),
   now = new Date(),
   mtime = new Date(now + 10000),
   mounted;

describe("stat", function(){

   before(function(){
      mounted = mfs.mount({
         time: now,
         items: {
            file: 'qwerty',
            file2: {
               content: new Buffer('qwertyuiop'),
               mode: parseInt('0750', 8),
               uid: 10,
               gid: 20,
               ctime: 'Tue May 07 2013 17:09:57 GMT+0400',
               mtime: mtime,
               atime: -10000
            },
            dir: {
               items: {},
               mode: parseInt('0750', 8),
               uid: 10,
               gid: 20,
               ctime: 'Tue May 07 2013 17:09:57 GMT+0400',
               mtime: mtime,
               atime: "+10000"
            }
         }
      }, '/mnt/mock');

   });

   it("can read file stats", function(){

      var stat = fs.statSync('/mnt/mock/file');
      assert.equal(true, stat.isFile());
      assert.equal(false, stat.isDirectory());

      assert.equal(+now, +stat.ctime);
      assert.equal(+now, +stat.atime);
      assert.equal(+now, +stat.mtime);

      assert.equal(6, stat.size);
      assert.equal(0, stat.uid);
      assert.equal(0, stat.gid);
      assert.equal(parseInt('0777', 8), stat.mode);

      stat = fs.statSync('/mnt/mock/file2');
      assert.equal(true, stat.isFile());
      assert.equal(false, stat.isDirectory());

      assert.equal(+new Date('Tue May 07 2013 17:09:57 GMT+0400'), +stat.ctime);
      assert.equal(+now - 10000, +stat.atime);
      assert.equal(+mtime, +stat.mtime);

      assert.equal(10, stat.size);
      assert.equal(10, stat.uid);
      assert.equal(20, stat.gid);
      assert.equal(parseInt('0750', 8), stat.mode);

      stat = fs.statSync('/mnt/mock/dir');
      assert.equal(false, stat.isFile());
      assert.equal(true, stat.isDirectory());

      assert.equal(+new Date('Tue May 07 2013 17:09:57 GMT+0400'), +stat.ctime);
      assert.equal(+now + 10000, +stat.atime);
      assert.equal(+mtime, +stat.mtime);

      assert.equal(0, stat.size);
      assert.equal(10, stat.uid);
      assert.equal(20, stat.gid);
      assert.equal(parseInt('0750', 8), stat.mode);

   });

   it("isBlockDevice, isCharacterDevice, isFIFO, isSocket is always false", function(){
      var stat = fs.statSync('/mnt/mock/file');
      assert.equal(false, stat.isBlockDevice());
      assert.equal(false, stat.isCharacterDevice());
      assert.equal(false, stat.isFIFO());
      assert.equal(false, stat.isSocket());
   });

   after(function(){
      mounted.umount();
   });
});

