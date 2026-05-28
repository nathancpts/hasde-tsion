if (
  ("undefined" !== typeof(window.CalJJSInterface)) &&
  ("undefined" !== typeof(window.CalJJSInterface.isDarkMode)) &&
  window.CalJJSInterface.isDarkMode()
) {
  $(document.body).addClass("dark-mode");
} else if (window.NativePlatform === 'ios') {
  window.Native.isDarkMode().then((b) => {
    $(document.body).toggleClass("dark-mode", !!b);
  });
}

function setFontSize(bodyFontSize, reposition) {
  let perc;
  let $middleElt;
  const halfScreen = window.innerHeight/2;

  if (reposition) {
    $middleElt = $(document.elementFromPoint(100, halfScreen));
    if ($middleElt.length === 0) {
        $middleElt = $(document.elementFromPoint(100, halfScreen*2./3.));
    }
    let pickTop = 3;
    while ($middleElt.eq(0)?.[0]?.nodeName === 'BLOCK' && pickTop < 10) {
        $middleElt = $(document.elementFromPoint(100, halfScreen*2./(pickTop++)));
    }
    if ($middleElt.eq(0)?.[0]?.nodeName === 'BLOCK')
        reposition = false;
    else {
        const $closestParag = $middleElt.closest("parag");
        $middleElt = $closestParag.length === 0 ? $middleElt : $closestParag;

        const middleEltTop = $middleElt.position().top;
        const middleEltHeight = $middleElt.height();
        perc = (window.scrollY + halfScreen - middleEltTop) / middleEltHeight;
    }
  }

  document.body.style.fontSize = `${bodyFontSize}em`;

  if (reposition) {
    scrollTo({top: $middleElt.position().top - halfScreen + perc*$middleElt.height()});
  }
}

let contextResolver;
const siddurContext = new Promise(resolve => {
    contextResolver = resolve;
});

window.siddurContext = siddurContext;
window.contextResolver = contextResolver;

let platform = "";

let autoFollow = true;

const removeIf = (condition, selectorToRemove, selectorElse) => {
    if (condition) {
        $(selectorToRemove).remove();
    } else if (selectorElse) {
        $(selectorElse).remove();
    }
};

const removeKeepIf = (condition, selectorRemove, selectorKeep) => {
    if (condition) {
        remove(selectorRemove);
        if (selectorKeep) keep(selectorKeep);
    } else {
        keep(selectorRemove);
        if (selectorKeep) remove(selectorKeep);
    }
};

window.runSiddur = async () => {
    await dynamicLoading();
    const context = await siddurContext;
    if (context.fontSize) {
        setFontSize(context.fontSize);
    }

    if (context.teshuva10) { $(".not-teshuva-10").remove(); }
    else {
      $(".teshuva-10").remove();
      if (!context.taanit) {
        $(".teshuva-10-or-taanit").remove();
      }
    }

    removeIf(platform === "android", ".no-android");
    removeIf(platform === "ios", ".no-ios");

    const takeCareOfDateSensitiveBlocks = () => {
        removeKeepIf(!context.chanuka, ".chanuka", ".not-chanuka");
        removeIf(!context.purim, ".purim");
        removeIf(!context.pesach, ".pesach");
        removeIf(!context.succot, ".succot");
        removeKeepIf(!context.chodesh, ".chodesh", ".not-chodesh");
        removeIf(!context.yaalei, ".yaalei");
        removeIf(context.av9, ".not-av9", ".av9");
        removeIf(context.shishi, ".not-shishi", ".shishi");
        removeIf(!context.taanit, ".taanit");
        removeIf(context.tachanunMincha, ".not-tachanun-mincha", ".tachanun-mincha");
        removeIf(context.moridHaTal, ".not-morid", ".morid");
        removeIf(context.barekh, ".not-barekh", ".barekh");
        removeIf(!context.elulAdHoshaanaRabba, ".elul-hoshaana-rabba");
        removeIf(context.israel, ".chutz-laaretz-only");
        removeIf(context.israel, ".show-if-not-israel", ".show-if-israel");
        removeIf(!context.omer, ".has-omer");
        removeIf(!context.motsash, ".motsash");
        removeIf(!context.motsashOrMotsaYT, ".motsash-or-motsaYT");

        if (context.tachanun) {
            keep(".tachanun");
            remove(".not-tachanun");
        } else {
            remove(".tachanun");
            keep(".not-tachanun");
        }

        if (context.within30Days) {
          $(".within-30-days").addClass("sensitive");
        }
        if (context.within30DaysBracha) {
          $(".within-30-days-bracha").addClass("sensitive");
        }

        if (window.prepareSensitiveBlocks) {
            window.prepareSensitiveBlocks(context);
        }
        removeIf(true, ".removed");
    };

    if (window.delayedSensitiveBlocks) {
        window.delayedSensitiveBlocks = takeCareOfDateSensitiveBlocks;
    } else {
        takeCareOfDateSensitiveBlocks();
    }

    /** Donate **/
    $(`.donate .language-dependent[data-language=${context.donateLanguage ?? context.language}`).addClass("show");

    $("#container").removeClass("hidden");


    // When we know the page is loaded and the elements are in place,
    // capture the anchors' positions and install the scroll observer.
    setTimeout(function () {
        installScrollObserver();
    }, 300);

    installMinyanCollapsibleHandler();

    if (window.CalJJSInterface && CalJJSInterface.makeVisible) {
        setTimeout(() =>
            CalJJSInterface.makeVisible(),
            80
        );
    }

    return context;
};

function createMenuBar(context) {
    let randomMenu = 0;
    $("a[name]").each(function () {
        var $this = $(this);
        if ($this.css("display") === "none") {
            return;
        }
        var name = $this.attr("name");
        var title = $this.attr("title");
        ++randomMenu;
        $this.data("random-menu", randomMenu);
        title = '&nbsp;' + title + '&nbsp;';
        var additionalClasses = $this.data("additional-classes");
        $("#menubar ul").append("<li><a href=\"#" + name + "\" data-name=\"" + name + "\" class=\"random-menu-" + randomMenu + " " + additionalClasses + "\">" + title + "</a></li>");
    });

    $("#menubar a").click(function (event) {
        event.preventDefault();
        var $a = $(this);
        var name = $a.data("name");
        var offsetTop = $("a[name='" + name + "']").offset().top - 100;

        // Stoppons provisoirement le auto-follow de la reglette
        autoFollow = false;
        setTimeout(function () { autoFollow = true;}, 2000);

        $('html, body').animate({
            scrollTop: offsetTop
        }, 400);

        //Interroger le position().left de l'objet A pour savoir où il se trouve
        // relativement au viewport
        // et ajouter sa demi-largeur
        var offsetLeft = $a.position().left + $a.width()/2.;
        //Interroger le scroll actuel du menubar
        var scrollLeft = $("#menubar ul").scrollLeft();

        //Largeur de l'écran
        var fullWidth = $("html").width();

        $("#menubar a").removeClass("turned-on");
        $a.addClass("turned-on");

        //Ramener le milieu du A au milieu de l'écran
        $("#menubar ul").animate({
            scrollLeft: scrollLeft - (fullWidth/2. - offsetLeft)
        }, 400);

    });

    $("#menubar a").eq(0).addClass("turned-on");

    if (context.debug) {
        $("body").addClass("debug");
    }
}

function installMinyanCollapsibleHandler() {
  $("collapsible").click((evt) => {
    // TODO: collapsible groups mutual toggle
    const $container = $(evt.currentTarget);
    const groupName = $container.attr("data-group");
    if ($container.hasClass("expanded")) {
        // a <collapsible> that has a data-group property
        // indicates that whenever it is expanded, we need to hide any
        // element that has a corresponding data-collapsible-group attribute.
        if (groupName) {
            $(`[data-collapsible-group="${groupName}"]`).css("display", "block");
        }
        $container.css('height', '1.05lh');
        $container.removeClass("expanded");
        window.scrollTo({
          left: 0,
          top: $container.position().top - 50,
          behaviour: 'smooth',
        });
    } else {
        if (groupName) {
            $(`[data-collapsible-group="${groupName}"]`)
                .css("display", "none");
        }
        let h = 0;
        $container.children().each((i, c) => { h += $(c).outerHeight(true); });
        $container.css("height", `${h}px`);
        $container.addClass("expanded");
    }
  });
}

let previousScrollTop = 0;
let menuTimer;

/**
 * `immediate` performs the sync (scrollTop -> menu) right away,
 * not animated, and does not trigger recursive repeats.
 */
function installScrollObserver(immediate) {
    var $window = $(window);
    var previousRandomMenu = 0;
    var menubarHeight = $("#menubar").height();
    const mapAnchors = [];

    $("a[name]").each(function () {
      const $this = $(this);
      mapAnchors.push({"top": $this.offset().top, "a": $this});
    });

    function run() {
        if ($("#menubar ul").length === 0) {
            clearTimeout(menuTimer);
            return;
        }

        const force = (window.CalJSiddurForceMenubarRefresh === undefined ? false : window.CalJSiddurForceMenubarRefresh);
        // This should be written like this:
        //    const force = window.CalJSiddurForceMenubarRefresh ?? false;
        // but iOS 12 fails on ??, so I'm forced to level down for now.

        var scrollTop = $window.scrollTop();
        if (!force && (scrollTop === previousScrollTop)) return;
        previousScrollTop = scrollTop;
        if (window.captureScrollPosition) window.captureScrollPosition();

        // Si on vient de cliquer sur un menu de la reglette depuis
        // moins de deux secondes, inutile de faire le autofollow.
        if (! autoFollow) return;


        // Chercher lequel on depasse
        var lastAboveTop = mapAnchors[0];
        var followingSection;
        var i;
        for (i = 1; i < mapAnchors.length; ++ i) {
            followingSection = mapAnchors[i];
            if (followingSection.top > scrollTop + menubarHeight) {
                break;
            }
            lastAboveTop = followingSection;
        }


        // Check now how close we are from the next one:
        // (i est deja le next parce qu'on a break avant de capturer le lastAboveTop qui correspondait au nouveau i)
        if (i < mapAnchors.length) {
            // There is a following section
            if (followingSection.top - scrollTop <= 250) {
                lastAboveTop = followingSection;
            }
        }

        if (!lastAboveTop) return;
        var randomMenu = lastAboveTop.a.data("random-menu");
        if (!force && (randomMenu === previousRandomMenu)) {
            return;
        }
        window.CalJSiddurForceMenubarRefresh = false;
        previousRandomMenu = randomMenu;
        var $menuLink = $(".random-menu-" + randomMenu);

        //Largeur de l'écran
        var fullWidth = $("html").width();

        //Interroger le position().left de l'objet A pour savoir où il se trouve
        // relativement au viewport
        // et ajouter sa demi-largeur
        var offsetLeft = $menuLink.position().left + $menuLink.width()/2.;
        //Interroger le scroll actuel du menubar
        var scrollLeft = $("#menubar ul").scrollLeft();

        $("#menubar a").removeClass("turned-on");
        $menuLink.addClass("turned-on");

        if (immediate) {
            $("#menubar ul").scrollLeft(scrollLeft - (fullWidth/2. - offsetLeft));
        } else {
            $("#menubar ul").animate({
                scrollLeft: scrollLeft - (fullWidth/2. - offsetLeft)
            }, 400);
        }
    }

    run();

    if (!immediate) {
        menuTimer = setTimeout(function () {
            installScrollObserver();
        }, 2000);
    }
}

async function dynamicLoading() {
  if ("undefined" === typeof(window.Native))
    return;

  const htmlBlocks = await Promise.all(
    $("[data-load-file]").map((_, elt) =>
      Native.load($(elt).data("load-file"))
    ).get()
  );
  $("[data-load-file]").html((i) => htmlBlocks[i]);
}


(async () => {
    if ("undefined" !== typeof(window.CalJJSInterface)) {
        platform = "android";
        contextResolver(JSON.parse(CalJJSInterface.calcContext()));
    } else {
//        if (window.navigator.userAgent.match(/iphone|ipad|mac os x/i) && window.navigator.platform !== 'MacIntel') {
           platform = "ios";
           document.location.href = 'calj-siddur://request-for-context';
//        } else {
//           console.log("Time to inject context.");
//        }
    }

    window.caljContext = await siddurContext;
})();

runSiddur().then((context) => {
    window.caljOnClickBack = () => 0;
    if (window.postSiddur) {
        window.postSiddur(context);
    }
    // Finally remove all parts that have been tagged ".removed"
    $(".removed").remove();

    // Once all the dynamic blocks have been computed,
    // we're ready to build the ToC
    createMenuBar(context);

    if (context.tetragram) {
      walkTetra($("#container").get(0));
      walkTetra($(".tetragramable").get(0));
      walkShevaNa($("#container").get(0));
      walkShevaNa($(".tetragramable").get(0));
    }

    transformFirstLetter();

    setTimeout(restoreScrollPosition, 180);
});

function remove(selector) {
    $(selector).addClass("removed").removeClass("kept");
}
function keep(selector) {
    $(selector).removeClass("removed").addClass("kept");
}

function walkTetra(elt) {
    $(elt).contents().each(function (i, x) {
        if (x.nodeType === 3 && x.textContent.trim()) {
            $(x).replaceWith(
                // He Wide
                x.textContent.replaceAll(/(י[^א-ת ]*ה[^א-ת ]*ו[^א-ת ]*|יוּהוּווּ)ה([^א-ת ]*)/g, "<tetra>$1&#xFB23;$2</tetra>")
            );
        } else if (x.nodeType === 1 && x.tagName !== 'PARASHA') {
            walkTetra(x);
        }
    });
}

function walkShevaNa(elt) {
    /*
     * 1. daggesh letter
     * 2. initial letter
     * 3. first of doubled consonant
     * 4. second of doubled sheva
     * 5. preceded by a long vowel:
     *      - Holam
     *      - mute alef post Holam,
     *      - kamatz (normally with meteg)
     *      - mute yod post Hiriq
     *      - shuruk (vav daggesh) unless it is the initial
     *
     * Cancelled if:
     *  - sheva na is on last letter
     *  - sheva na is followed by a long vowel
     *       (eg:  בָּחָֽרְתָּ, עָֽלְמָֽא, נִשְׁעָֽנְנוּ )
     */
    const sheva = String.fromCharCode(0x05b0);
    const dagesh= String.fromCharCode(0x05bc);
    const aleph = String.fromCharCode(0x05d0);
    const nun = 'נ';
    const tav = String.fromCharCode(0x05ea);
    const sofpassuk = String.fromCharCode(0x05c3);
    const meteg = String.fromCharCode(0x5bd);
    const makaf = String.fromCharCode(0x5be);
    const space = ' ,.:\t\n' + sofpassuk + makaf;
    const letter = `[${aleph}-${tav}]`;
    const sign = `[^${aleph}-${tav}${space}<>]`;
    const vavHolam = "וֹ|וּ";
    const youd = 'י';
    const hiriq = 'ִ';
    const holam = 'ֹ';
    const segol = 'ֶ';
    const patah = 'ַ';
    const halfSquare = '֣';
    const kamats = 'ָ';
    const shuruk = 'וּ';
    const tsere = 'ֵ';

    const regExDageshUnlessLast = new RegExp(`(${letter}${sign}*${dagesh}${sign}*${sheva})([^$${space}])`, "g");
    const regExInitial = new RegExp(`(^|[${space}])(${letter}${sign}*${sheva}${sign}*)`, "g");
    // Didn't find another way (more generic, included in the kamatz-meteg rule) to take care of : וְנָֽתְנוּ
    const reAfterMetegEndingTenu = new RegExp(`(${kamats}${meteg})(תְ)(נוּ($|[${space}]))`, "g");
    // the aleph-kamatz part is because of מָֽלְאָה in the 1st brakha of Shema Shacharit
    // I've added "is not followed by תָּ" because of וְשָׂבָֽעְתָּ in Shema
    // I've added "is not followed by כִי" because of לִמְנוּחָֽיְכִי in Hallel
    const regExAfterMetegUnlessLast = new RegExp(`([^${segol}${patah}${hiriq}]${meteg})(${letter}${sheva})((תָיו|${aleph}${kamats})|((?!תָּ)(?!כִי)(?!${letter}${dagesh}?${kamats}${letter})(?!${nun}${shuruk})([^$${space}])))`, "g");
    const regExSecondShevaUnlessLast = new RegExp(`(${sheva})(${letter}${sign}*${sheva}${sign}*)([^$${space}])`, "g");
    // Added: (?!תֵּהּ) because of גְּבוּרְתֵּהּ in Ouva Letzion
    const regExVavHolamUnlessFirstOrLast = new RegExp(`(${letter}${sign}*(${vavHolam}))(${letter}${sheva}${sign}*)(?!תֵּהּ)(${sign}*${letter})`, "g");
    const regExHiriqYoudMetegUnlessLast = new RegExp(`(${hiriq}(${meteg}|${halfSquare})${youd})(${letter}${sheva}${sign}*)([^$${space}])`, "g");
    const regExHolamHalfsquare = new RegExp(`(${holam}(${halfSquare}|${meteg}))(${letter}${sign}*${sheva}(?!נָה))`, "g");
    const regExHolamAlef = new RegExp(`(${holam}${dagesh}?${aleph})(${letter}${sheva})`, "g");
    const regExTsereYoudMetegUnlessLast = new RegExp(`(${tsere}(${meteg}|${halfSquare})?${youd})(${letter}${sheva}${sign}*)([^$${space}])`, "g");
    // The "not nun-shuruk" is because of the word נִשְׁעָֽנְנוּ in amida
    const reDoubleConson = new RegExp(`((${letter})${sheva})(?!נוּ)(\\2)`, "g");
    const reCancelAlmaya = new RegExp(`(עָֽ)<shna[^>]*>(לְ)</shna>(מ${sign}*י)`, "g");

    walkShevaNaRecur(elt);

    function walkShevaNaRecur(rElt) {
        $(rElt).contents().each(function (i, x) {
            if (x.nodeType === 3 && x.textContent.trim()) {
                $(x).replaceWith(
                    x.textContent
                        .replaceAll(reDoubleConson, "<shna>$1</shna>$2")
                        .replaceAll(regExDageshUnlessLast, "<shna>$1</shna>$2")
                        .replaceAll(regExInitial, "$1<shna>$2</shna>")
                        .replaceAll(reAfterMetegEndingTenu, "$1<shna>$2</shna>$3")
                        .replaceAll(regExAfterMetegUnlessLast, "$1<shna>$2</shna>$3")
                        .replaceAll(reCancelAlmaya, "$1$2$3")
                        .replaceAll(regExSecondShevaUnlessLast, "$1<shna>$2</shna>$3")
                        .replaceAll(regExVavHolamUnlessFirstOrLast, "$1<shna>$3</shna>$4")
                        .replaceAll(regExHiriqYoudMetegUnlessLast, "$1<shna>$3</shna>$4")
                        .replaceAll(regExHolamHalfsquare, "$1<shna>$3</shna>")
                        .replaceAll(regExHolamAlef, "$1<shna>$2</shna>")
                        .replaceAll(regExTsereYoudMetegUnlessLast, "$1<shna>$3</shna>$4")
                );
            } else if (x.nodeType === 1 && x.tagName !== 'TETRA' && x.tagName !== 'PARASHA') {
                walkShevaNaRecur(x);
            }
        });
    }
}

const reFirstLetter = new RegExp(/^([א-ת][^א-ת]*)(.*)$/m);
const processOneFirstLetter = elt => {
    if ($(elt).contents().get(0).nodeName !== 'SHNA') {
        const match = $(elt).html().match(reFirstLetter);
        if (match) {
            $(elt).html("<strong>"+match[1]+"</strong>"+match[2]);
        }
    } else {
        $(elt).contents().eq(0).wrap("<strong>");
    }
};

function transformFirstLetter() {
    $("fletter group").each((i, x) => processOneFirstLetter(x));
    $("fletter passuk").each((i, x) => processOneFirstLetter(x));
}

window.captureScrollPosition = () => {
  const posToSave = parseInt($(document).scrollTop());
  window.localStorage.setItem(`scrollPos[${caljContext.tefila}][${caljContext.rite}]`, JSON.stringify({
    pos: posToSave,
    ts: Date.now(),
  }));
};
window.restoreScrollPosition = () => {

  if (window.caljLocalTefilaConfig?.skipRestoreScrollPos)
    return;

  const { pos, ts } = JSON.parse(window.localStorage.getItem(`scrollPos[${caljContext.tefila}][${caljContext.rite}]`) ?? '{}');
  let posToRestore = 0;
  if (ts > Date.now() - 3660*1000) {
    posToRestore = parseInt(pos);
  }

  $(document).scrollTop(posToRestore);
  installScrollObserver(true);
}
