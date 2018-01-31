# SmashTemplateEngine [![Build Status](https://travis-ci.org/Noxs/SmashTemplateEngine.svg?branch=master)](https://travis-ci.org/Noxs/SmashTemplateEngine) [![codecov](https://codecov.io/gh/Noxs/SmashTemplateEngine/branch/master/graph/badge.svg)](https://codecov.io/gh/Noxs/SmashTemplateEngine)

A template Engine with basic features :<br />
&ensp;&ensp;- Variables handling<br />
&ensp;&ensp;- If condition<br />
&ensp;&ensp;- For loops<br />
&ensp;&ensp;- Filters handling<br />

## Getting Started

Here you will find how to install this package and syntax that should be used in templates.

### Installing

All you need is to install the npm package.

```
npm install smash-template-engine
```

You can now require the package and create an instance of TemplateEngine :

```
const STE = require('smash-template-engine');
const templateEngine = new STE.TemplateEngine();
```

## Usage

The only method you need is templateEngine.render().
It takes two parameters :<br />
&ensp;&ensp;- The first one is a string, which is actually your template<br />
&ensp;&ensp;- The second one (optional) is an object, it corresponds to your context, containing all the variables used in the template<br />
&ensp;&ensp;- The third one (optional) is a string that corresponds to your stylesheet. You can put your css into a seperated file, to improve performances <br />

templateEngine.render() method is asynchronous, it resolves an object with a content attribute which is basically the compiled template.

To make it simple, it should look like :

```
templateEngine.render(string[, parameters, style]).then(function (template) {
    let renderer = template.content;
},function (error) {
    console.log(error);
});
```

### Translate Filter

If you pretend to use the translate filter you will have to check few easy peasy steps before.
The template engine needs to know the translations used in the template, but also the wished language and a default language that is used as fallback.

A translator object manages the translation, so all you need may look like this :

```
const translator = STE.translator;
const translations = {
    'HELLO_WORD' : {
        en : 'Hello',
        fr : 'Bonjour',
        de : 'Hallo'
    }
};
const language = 'fr';
const fallbackLanguage = 'en';

translator.translations = translations;
translator.language = language;
translator.fallbackLanguage = fallbackLanguage;
```
You can now call the translate filter in your template.

## Syntax

It is highly inspired of twig, so it might look familiar.

### Variables

It is the most common feature, it allow you to insert variables from a context into a template.

```
{{ Variable }}
```

### If condition

Everything between the opening and the closing tag will be either inserted or removed in the compiled template depending on if the condition is checked or not. The else statement also works as known.

```
{% if 'hello' === 'world' %}
    It won't be inserted
{% else %}
    It will be inserted
{% endif %}
{% if 1 === 1 %} It will be inserted {% endif %}
```

### For loop

Everything between the opening and the closing will be repeated as many as there's key in a given object that is defined in the context.

```
{% for user in users %} {{user.name}} is {{user.age}} years old. {% endfor %}
```

### Filters

Filters allow to apply treatment on a variable. They are few filters build-in : Translate, date and size.

#### Translate filter

Quite useful to deal with several languages. it looks like this :

```
{{ 'HELLO_KEYWORD' | translate }}
```

You can also add variable into translations, it is made so :

```
// Considering
const translations : {
    "HELLO_WORD" : {
        "en" : "Hello %name%"
    }
};
// And name defined in the global context

{{ 'HELLO_KEYWORD' | translate({name : "James"}) }}  // Hello James
```

NB : In order to use translate filter, you'll need to tell translator your intention, make sure you've read [Translate Filter](#translate-filter)

#### Date filter

The build-in date filter allow you to transform all your UNIX timestamp into a string formatted as you wish and translated into the language you want.

It can have no parameter specified, so the format will be defined thanks to the language set in the translator.

```
const timestamp = 1517407220;
{{ timestamp | date }} // January 31, 2018
```

But you can set the format you want as parameter :

```
const timestamp = 1517407220;
{{ timestamp | date({format : "MM-DD-YYYY"}) }} // 31-01-2018
```

This filter is based on [MomentJS](https://momentjs.com/), just check it out for specific format.

#### size filter

It convert a Bytes number into a appropriated unit :

```
{{ 1 | size }}                      // "1 B"
{{ 10 | size }}                     // "10 B"
{{ 100 | size }}                    // "100 B"
{{ 1000 | size }}                   // "1 KB"
{{ 10000 | size }}                  // "10 KB"
{{ 100000 | size }}                 // "100 KB"
{{ 1000000 | size }}                // "1 MB"
{{ 10000000 | size }}               // "10 MB"
{{ 100000000 | size }}              // "100 MB"
{{ 1000000000 | size }}             // "1 GB"
{{ 10000000000 | size }}            // "10 GB"
{{ 100000000000 | size }}           // "100 GB"
{{ 1000000000000 | size }}          // "1 TB"
{{ 10000000000000 | size }}         // "10 TB"
{{ 100000000000000 | size }}        // "100 TB"
{{ 1000000000000000 | size }}       // "1 PB"
{{ 10000000000000000 | size }}      // "10 PB"
{{ 100000000000000000 | size }}     // "100 PB"
```

### Nested filters

Sometimes, you may need nested filter, to apply a filter on the result of another filter.

Let's have a look of a case you may face : use date into a translation.

```
const translations : {
    "HELLO_WORD" : "Hello %name%. Today is %date%"
};
const timestamp = 1517407220;
{{"HELLO_WORD" | translate( { name : "James", date : date(timestamp, {format : ""MMMM Do YYYY"})} )}} // Hello James. Today is January 31st 2018
```

#### Custom filters

You can add you own template to the template engine.
Let's consider the template hereunder as an example :
```
{{variable | myFilter(param1, param2)}}
```

Avery basic filter structure may look like this :
```
function myFilter(variable, param1, param2){
    //do things
    return;
}

module.exports = myFilter;
```

Make sure you placed your filter in /filters

Then you need to add your filter to the filters constructor located in lib/filters.js

Please take a look at how it should be :
```
const myFilter = {
        process : require('../filters/myFilter.js'),
        name : 'myFilter'
};
this.add(myFilter);
```

Now you can use :
```
{{ variable | myFilter }}
```

## Running the tests

Tests are run with Mocha and Chai.

```
npm test
```

## Examples

Here is a full examples of how to use the template engine.



```
const STE = require('smash-template-engine');
const templateEngine = new STE.TemplateEngine();
const translator = STE.translator;
const string = '<body><main>{{"HELLO_WORD" | translate}}</main><h1>{%if title %}{{title}}{% endif %}</h1><div>{% for user in users %}<p>{%if user.hobby %}{{user.firstname}} enjoys {{user.hobby}}{% endif %}{% if user.age < 30 %} and is {{user.age}} {% endif %}{{user.firstname}} lastname is {{user.lastname}}</p>{% endfor %}<p>{{day | dayTest(\'Monday\')}}</p></div></body>';

const parameters = {
    title : "Welcome",
    users : [
        {
            firstname : "Antoine",
            lastname : "Dupont",
            age : 30,
            hobby : null,
        },
        {
            firstname : "Bonz",
            lastname : "Atron",
            age : "25",
            hobby : "Kendama"
        }
    ],
    day : 'Friday',
};
const translations = {
    'HELLO_WORD' : {
        en : 'Hello',
        fr : 'Bonjour',
        de : 'Hallo'
    },
    'HOW_ARE_YOU_QUESTION' : {
        en : 'How are you?',
        fr : 'Comment ça va?',
        de : "Wie geht's?"
    }
};
const language = 'en';
const fallbackLanguage = 'fr';
translator.translations = translations;
translator.language = language;
translator.fallbackLanguage = fallbackLanguage;

templateEngine.render(string, parameters).then( (result) => {
    let renderer = result.content;
}, (error) => {
    console.log(error);
});
```

renderer now should be :

```
'<body><main>Hello</main><h1>Welcome</h1><div><p>Antoine lastname is Dupont</p><p>Bonz enjoys Kendama and is 25 Bonz lastname is Atron</p><p>It is not Monday. It is Friday.</p></div></body>'
```
