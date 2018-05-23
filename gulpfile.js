const gulp = require("gulp");
const path = require("path");
const install = require("gulp-install");


const OUTPUT_DIR = path.join(__dirname, 'out', 'app');

gulp.task("build", function () {
    gulp.src([
        path.join(__dirname, "main.js"),
        path.join(__dirname, "package.json")
    ]).pipe(gulp.dest(OUTPUT_DIR));
    gulp.src(path.join(__dirname, "res", "**/*")).pipe(gulp.dest(path.join(OUTPUT_DIR, "res")));
    gulp.src(path.join(__dirname, "renderers", "**/*")).pipe(gulp.dest(path.join(OUTPUT_DIR, "renderers")));
});

gulp.task("ProductionInstall", ["build"], function () {
    gulp.src(path.join(OUTPUT_DIR, 'package.json')).pipe(install({
        npm: '--production'
    }));
});


gulp.task("default", ["build"]);
