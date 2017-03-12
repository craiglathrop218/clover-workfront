var gulp = require("gulp");
var ts = require("gulp-typescript");
var tsProject = ts.createProject("tsconfig.json");

gulp.task("default", function () {
	gulp.src('src/**/*.d.ts')
			.pipe(gulp.dest("dist"));
	gulp.src('src/**/*.ts')
			.pipe(gulp.dest("dist"));
	return tsProject.src()
			.pipe(tsProject())
			.js.pipe(gulp.dest("dist"));
});