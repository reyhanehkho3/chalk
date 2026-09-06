import test from 'ava';
import chalk, {Chalk, themes} from '../source/index.js';

chalk.level = 3;

// `addTheme` mutates the shared `themes` registry, so track the names added in this file and
// clean them up between tests to keep them hermetic. Cached theme objects on instances may
// still hold stale entries, but no test relies on cross-test state.
const addedThemeNames = new Set();
test.afterEach(() => {
	for (const name of addedThemeNames) {
		delete themes[name];
	}

	addedThemeNames.clear();
});

test('theme: exposes every default preset', t => {
	t.is(typeof chalk.theme.error, 'function');
	t.is(typeof chalk.theme.success, 'function');
	t.is(typeof chalk.theme.warning, 'function');
	t.is(typeof chalk.theme.info, 'function');
	t.is(typeof chalk.theme.muted, 'function');
});

test('theme: error applies bold + red', t => {
	t.is(chalk.theme.error('Boom'), '\u{1B}[1m\u{1B}[31mBoom\u{1B}[39m\u{1B}[22m');
});

test('theme: success applies green', t => {
	t.is(chalk.theme.success('Yes'), '\u{1B}[32mYes\u{1B}[39m');
});

test('theme: warning applies bold + yellow', t => {
	t.is(chalk.theme.warning('Hmm'), '\u{1B}[1m\u{1B}[33mHmm\u{1B}[39m\u{1B}[22m');
});

test('theme: info applies cyan', t => {
	t.is(chalk.theme.info('FYI'), '\u{1B}[36mFYI\u{1B}[39m');
});

test('theme: muted applies gray', t => {
	t.is(chalk.theme.muted('...'), '\u{1B}[90m...\u{1B}[39m');
});

test('theme: matches the equivalent chained style', t => {
	t.is(chalk.theme.error('x'), chalk.bold.red('x'));
	t.is(chalk.theme.success('x'), chalk.green('x'));
	t.is(chalk.theme.warning('x'), chalk.bold.yellow('x'));
	t.is(chalk.theme.info('x'), chalk.cyan('x'));
	t.is(chalk.theme.muted('x'), chalk.gray('x'));
});

test('theme: chains with other styles', t => {
	t.is(
		chalk.italic.theme.error('Boom'),
		'\u{1B}[3m\u{1B}[1m\u{1B}[31mBoom\u{1B}[39m\u{1B}[22m\u{1B}[23m',
	);

	t.is(
		chalk.theme.error.italic('Boom'),
		'\u{1B}[1m\u{1B}[31m\u{1B}[3mBoom\u{1B}[23m\u{1B}[39m\u{1B}[22m',
	);
});

test('theme: accepts multiple arguments joined by space', t => {
	t.is(
		chalk.theme.error('foo', 'bar'),
		'\u{1B}[1m\u{1B}[31mfoo bar\u{1B}[39m\u{1B}[22m',
	);
});

test('theme: empty string returns empty string', t => {
	t.is(chalk.theme.error(''), '');
});

test('theme: level 0 disables styling', t => {
	const instance = new Chalk({level: 0});
	t.is(instance.theme.error('Boom'), 'Boom');
});

test('theme: custom Chalk instances inherit the default presets', t => {
	const instance = new Chalk({level: 3});
	t.is(instance.theme.error('Boom'), '\u{1B}[1m\u{1B}[31mBoom\u{1B}[39m\u{1B}[22m');
	t.is(instance.theme.muted('...'), '\u{1B}[90m...\u{1B}[39m');
});

test('theme: per-instance override does not leak across instances', t => {
	const customError = chalk.bold.bgRed.white;
	const customChalk = new Chalk({level: 3});
	customChalk.theme.error = customError;
	t.is(customChalk.theme.error('Boom'), customError('Boom'));
	// Default chalk still produces the original `error` styling.
	t.is(chalk.theme.error('Boom'), '\u{1B}[1m\u{1B}[31mBoom\u{1B}[39m\u{1B}[22m');
});

test('theme: caches the theme object on first access', t => {
	t.is(chalk.theme, chalk.theme);
});

test('theme: visible suppresses output when level is too low', t => {
	const instance = new Chalk({level: 0});
	t.is(instance.visible.theme.error('Boom'), '');
	t.is(instance.theme.error.visible('Boom'), '');
});

test('themes export: exposes open/close pairs for every default preset', t => {
	for (const name of ['error', 'success', 'warning', 'info', 'muted']) {
		const entry = themes[name];
		t.true(typeof entry.open === 'string' && entry.open.length > 0, `${name}.open is a non-empty string`);
		t.true(typeof entry.close === 'string' && entry.close.length > 0, `${name}.close is a non-empty string`);
		t.true(entry.open.startsWith('\u{1B}['), `${name}.open is an ANSI escape`);
		t.true(entry.close.startsWith('\u{1B}['), `${name}.close is an ANSI escape`);
	}

	t.is(themes.error.open, '\u{1B}[1m\u{1B}[31m');
	t.is(themes.error.close, '\u{1B}[39m\u{1B}[22m');
	t.is(themes.success.open, '\u{1B}[32m');
	t.is(themes.warning.open, '\u{1B}[1m\u{1B}[33m');
});

test('addTheme: registers a custom preset available on the same instance', t => {
	addedThemeNames.add('happy');
	chalk.addTheme('happy', chalk.bold.green);
	t.is(typeof chalk.theme.happy, 'function');
	t.is(chalk.theme.happy('yay'), chalk.bold.green('yay'));
});

test('addTheme: makes the preset available on instances created afterwards', t => {
	addedThemeNames.add('loud');
	chalk.addTheme('loud', chalk.bgMagenta.white.bold);
	const instance = new Chalk({level: 3});
	t.is(instance.theme.loud('boom'), chalk.bgMagenta.white.bold('boom'));
});

test('addTheme: stores the captured open/close in the registry', t => {
	addedThemeNames.add('rainbow');
	chalk.addTheme('rainbow', chalk.hex('#FF8800').underline);
	t.is(themes.rainbow.open + 'x' + themes.rainbow.close, chalk.hex('#FF8800').underline('x'));
});

test('addTheme: returns the instance for chaining', t => {
	addedThemeNames.add('chained');
	t.is(chalk.addTheme('chained', chalk.cyan), chalk);
});

test('addTheme: overrides a previously registered preset', t => {
	addedThemeNames.add('overrideTarget');
	chalk.addTheme('overrideTarget', chalk.cyan);
	t.is(chalk.theme.overrideTarget('x'), chalk.cyan('x'));
	chalk.addTheme('overrideTarget', chalk.yellow);
	t.is(chalk.theme.overrideTarget('x'), chalk.yellow('x'));
});

test('addTheme: rebuilds the cached theme object on the called instance', t => {
	const instance = new Chalk({level: 3});
	// Trigger the cache.
	t.is(instance.theme.error('Boom'), '\u{1B}[1m\u{1B}[31mBoom\u{1B}[39m\u{1B}[22m');

	addedThemeNames.add('instant');
	instance.addTheme('instant', chalk.italic.yellow);
	// The cached theme is rebuilt and the new entry is visible without further `theme` access.
	t.is(instance.theme.instant('now'), chalk.italic.yellow('now'));
});

test('addTheme: rejects an empty name', t => {
	t.throws(() => chalk.addTheme('', chalk.red), {instanceOf: TypeError});
});

test('addTheme: rejects a non-string name', t => {
	t.throws(() => chalk.addTheme(42, chalk.red), {instanceOf: TypeError});
	t.throws(() => chalk.addTheme(null, chalk.red), {instanceOf: TypeError});
});

test('addTheme: rejects the bare `chalk` function', t => {
	t.throws(() => chalk.addTheme('invalid', chalk), {instanceOf: TypeError});
});

test('addTheme: rejects non-function builders', t => {
	t.throws(() => chalk.addTheme('invalid', 'not a builder'), {instanceOf: TypeError});
	t.throws(() => chalk.addTheme('invalid', null), {instanceOf: TypeError});
});

test('addTheme: captures the builder at its current level', t => {
	addedThemeNames.add('lvlCapture');
	const basic = new Chalk({level: 1});
	basic.addTheme('lvlCapture', basic.bgRed);
	// Level 1 uses the 16-color close (49), not the 256/16m form.
	t.is(themes.lvlCapture.close, '\u{1B}[49m');
});
