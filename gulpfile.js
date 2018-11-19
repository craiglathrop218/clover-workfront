var gulp = require("gulp");
var merge = require('merge2');  // Requires separate installation
var ts = require("gulp-typescript");
var rename = require('gulp-rename');
var project = ts.createProject("tsconfig.json", {
  typescript: require('typescript'),
  declaration: true,
  module: "commonjs",
  target: "es2017",
  esModuleInterop: true
});
var projectEs6 = ts.createProject("tsconfig.json", {
  typescript: require('typescript'),
  declaration: false,
  module: "es2015",
  target: "es2017"
});

// https://github.com/ivogabe/gulp-typescript
gulp.task("es5", function () {
  var tsResult = gulp.src(['!./src/**/d.ts', './src/**/*.ts'])
      .pipe(project())
      .on("error",(err)=>{ console.log("Errors while compiling es5!", err); })
  ;
  return merge([
    tsResult.dts.pipe(gulp.dest("dist")),
    tsResult.js.pipe(gulp.dest("dist"))
  ]);
});

gulp.task("es6", function () {
  var tsResult = gulp.src(['!./src/**/d.ts', './src/**/*.ts'])
      .pipe(projectEs6())
      .on("error",(err)=>{ console.log("Errors while compiling es5!", err); })
  ;
  return tsResult.js
    .pipe(rename(function (path) {
      //console.log("File Path: " + JSON.stringify(path));
      if (path.extname === ".js") {
        path.extname = ".mjs"; // convert all .js files for node .mjs
      }
    }))
    .pipe(gulp.dest("dist"));
});

gulp.task("default", gulp.parallel("es5", "es6"));
