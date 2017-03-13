var gulp = require("gulp");
var merge = require('merge2');  // Requires separate installation
var ts = require("gulp-typescript");
var project = ts.createProject("tsconfig.json", {
	typescript: require('typescript'),
	declaration: true
});

// https://github.com/ivogabe/gulp-typescript
gulp.task("default", function () {
	var tsResult = gulp.src(['!./src/**/d.ts', './src/**/*.ts']).pipe(project());
	//var tsResult = project.src().pipe(project());
	return merge([
		tsResult.dts.pipe(gulp.dest("dist")),
		tsResult.js.pipe(gulp.dest("dist"))
	]);
});