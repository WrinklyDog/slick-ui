SlickUI.Element = SlickUI.Element ? SlickUI.Element : { };

/**
 * Create an interactable button. After initialisation,
 * you can use Button.events to add mouse events to the button.
 *
 * @author Richard Snijders <richard@fizz.nl>
 * @param x
 * @param y
 * @param width
 * @param height
 * @param maxChars
 * @constructor
 */
SlickUI.Element.TextField = function (x, y, width, height, maxChars) {
    if(typeof maxChars == 'undefined')
    {
        maxChars = 7;
    }
    this._x = x;
    this._y = y;
    this._offsetX = x;
    this._offsetY = y;
    this._width = width;
    this._height = height;
    this.maxChars = maxChars;
    this.container = null;
    this.value = '';

    this.events = {
        onOK: new Phaser.Signal(),
        onToggle: new Phaser.Signal(),
        onKeyPress: new Phaser.Signal()
    };
};

/**
 * Internal Container handling.
 * 
 * @param container
 */
SlickUI.Element.TextField.prototype.setContainer = function (container) {
    this.container = new SlickUI.Container.Container(container);
};

/**
 * Initialisation slices the button's sprite up according to the
 * theme settings and adds it to the container.
 * Position and width will be calculated relatively to the
 * parent container.
 */
SlickUI.Element.TextField.prototype.init = function() {
    var theme = game.cache.getJSON('slick-ui-theme');

    var x = this.container.x = this.container.parent.x + this._x;
    var y = this.container.y = this.container.parent.y + this._y;
    var width = this.container.width = Math.min(this.container.parent.width - this._x, this._width);
    var height = this.container.height = Math.min(this.container.parent.height - this._y, this._height);
    this.container.x += Math.round(theme.text_field['border-x'] / 2);
    this.container.y += Math.round(theme.text_field['border-y'] / 2);
    this.container.width -= theme.text_field['border-x'];
    this.container.height -= theme.text_field['border-y'];

    var cutSprite = function(textField) {
        var bmd = game.add.bitmapData(width, height);

        bmd.copyRect(textField,new Phaser.Rectangle(0,0,theme.text_field['border-x'],theme.text_field['border-y'])); // Left corner
        bmd.copy(
            textField,
            theme.text_field['border-x'] + 1,
            0,
            1,
            theme.text_field['border-y'],
            theme.text_field['border-x'],
            0,
            width - theme.text_field['border-x'] * 2,
            theme.text_field['border-y']
        ); // Top border

        bmd.copyRect(textField,new Phaser.Rectangle(textField.width - theme.text_field['border-x'],0,theme.text_field['border-x'],theme.text_field['border-y']), width - theme.text_field['border-x']); // Right corner

        bmd.copy(
            textField,
            0,
            theme.text_field['border-y'] + 1,
            theme.text_field['border-x'],
            1,
            0,
            theme.text_field['border-y'],
            theme.text_field['border-x'],
            height - theme.text_field['border-y'] * 2
        ); // Left border

        bmd.copy(
            textField,
            textField.width - theme.text_field['border-x'],
            theme.text_field['border-y'] + 1,
            theme.text_field['border-x'],
            1,
            width - theme.text_field['border-x'],
            theme.text_field['border-y'],
            theme.text_field['border-x'],
            height - theme.text_field['border-y'] * 2
        ); // Right border

        bmd.copyRect(textField,new Phaser.Rectangle(0,textField.height - theme.text_field['border-y'],theme.text_field['border-x'],theme.text_field['border-y']), 0, height - theme.text_field['border-y']); // Left bottom corner
        bmd.copyRect(textField,new Phaser.Rectangle(textField.width - theme.text_field['border-x'],textField.height - theme.text_field['border-y'],theme.text_field['border-x'],theme.text_field['border-y']), width - theme.text_field['border-x'], height - theme.text_field['border-y']); // Right bottom corner
        bmd.copy(
            textField,
            theme.text_field['border-x'] + 1,
            textField.height - theme.text_field['border-y'],
            1,
            theme.text_field['border-y'],
            theme.text_field['border-x'],
            height - theme.text_field['border-y'],
            width - theme.text_field['border-x'] * 2,
            theme.text_field['border-y']
        ); // Bottom border

        bmd.copy(
            textField,
            theme.text_field['border-x'],
            theme.text_field['border-y'],
            1,
            1,
            theme.text_field['border-x'],
            theme.text_field['border-y'],
            width - theme.text_field['border-x'] * 2,
            height - theme.text_field['border-y'] * 2
        ); // Body
        return game.make.sprite(x, y, bmd);
    };

    this.sprite = game.make.sprite(x, y, cutSprite(game.make.sprite(0, 0, 'slick-ui-text_field')).texture);
    this.sprite.inputEnabled = true;
    this.sprite.input.useHandCursor = true;
    this.container.displayGroup.add(this.sprite);
    this.sprite.x = x;
    this.sprite.y = y;
    this._offsetX = x;
    this._offsetY = y;
    this.sprite.fixedToCamera = true;

    var hover = false;
    this.sprite.events.onInputOver.add(function() {hover = true}, this);
    this.sprite.events.onInputOut.add(function() {hover = false}, this);

    var kb = new SlickUI.Keyboard.Keyboard(Object.keys(theme.fonts)[Object.keys(theme.fonts).length - 1]);
    kb.group.cameraOffset.y = game.height;
    kb.group.visible = false;
    var kbAnimating = false;

    this.sprite.events.onInputDown.add(function () {
        if(kbAnimating) {
            return;
        }
        kbAnimating = true;
        if(!kb.group.visible) {
            kb.group.visible = true;
            game.add.tween(kb.group.cameraOffset).to( {y: game.height - kb.height}, 500, Phaser.Easing.Exponential.Out, true).onComplete.add(function () {
                kbAnimating = false;
            });
            this.events.onToggle.dispatch(true);
        }
        else {
            game.add.tween(kb.group.cameraOffset).to( {y: game.height}, 500, Phaser.Easing.Exponential.Out, true).onComplete.add(function () {
                kbAnimating = false;
                kb.group.visible = false;
            });
            this.events.onToggle.dispatch(false);
        }
    }, this);

    this.text = this.add(new SlickUI.Element.Text(8,0, "A")); // We put in a character to center it correctly
    this.text.centerVertically();
    this.text.text.text = this.value;

    kb.events.onKeyPress.add(function(key) {
        if(key == 'DEL') {
            this.value = this.value.substr(0, this.value.length - 1);
        }
        else {
            this.value = (this.value + key).substr(0, this.maxChars);
        }
        this.text.text.text = this.value;

        this.events.onKeyPress.dispatch(key);
    }, this);

    kb.events.onOK.add(function() {
        this.sprite.events.onInputDown.dispatch();

        this.events.onOK.dispatch();
    }, this);
};

/**
 * Add element to the container
 *
 * @param element
 * @returns {SlickUI.Container.Container}
 */
SlickUI.Element.TextField.prototype.add = function (element) {
    return this.container.add(element);
};


/* ------------------------------- */


/**
 * Setters / getters
 */
Object.defineProperty(SlickUI.Element.TextField.prototype, 'x', {
    get: function() {
        return this._x - this.container.parent.x;
    },
    set: function(value) {
        this._x = value;
        this.container.displayGroup.x = this.container.parent.x + value - this._offsetX;
    }
});

Object.defineProperty(SlickUI.Element.TextField.prototype, 'y', {
    get: function() {
        return this._y - this.container.parent.y;
    },
    set: function(value) {
        this._y = value;
        this.container.displayGroup.y = this.container.parent.y + value - this._offsetY;
    }
});

Object.defineProperty(SlickUI.Element.TextField.prototype, 'visible', {
    get: function() {
        return this.container.displayGroup.visible;
    },
    set: function(value) {
        this.container.displayGroup.visible = value;
    }
});

Object.defineProperty(SlickUI.Element.TextField.prototype, 'alpha', {
    get: function() {
        return this.container.displayGroup.alpha;
    },
    set: function(value) {
        this.container.displayGroup.alpha = value;
    }
});

// Try to avoid changing the width or height of elements.

Object.defineProperty(SlickUI.Element.TextField.prototype, 'width', {
    get: function() {
        return this.container.width
    },
    set: function(value) {
        var theme = game.cache.getJSON('slick-ui-theme');
        this._width = Math.round(value + theme.text_field['border-x']);
        this.sprite.destroy();
        this.init();
        this.container.displayGroup.sendToBack(this.sprite);
    }
});

Object.defineProperty(SlickUI.Element.TextField.prototype, 'height', {
    get: function() {
        return this.container.height
    },
    set: function(value) {
        var theme = game.cache.getJSON('slick-ui-theme');
        this._height = Math.round(value + theme.text_field['border-y']);
        this.sprite.destroy();
        this.init();
        this.container.displayGroup.sendToBack(this.sprite);
    }
});