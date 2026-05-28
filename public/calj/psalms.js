let displayHebrewNumbers = (localStorage.getItem('displayHebrewNumbers') === 'false') ? false : true;

window.caljLocalTefilaConfig = {
  ...(window.caljLocalTefilaConfig ?? {}),
  skipRestoreScrollPos: true,
};

function numberToHebrew(N) {
   if (!displayHebrewNumbers) {
      return N;
   }
   const sAlefBet = ["א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ", "ק", "ר", "ש", "ת"];

   const aValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400];
   let s = '';
   let i = 21;

   while(N >= 1) {
       if(N == 15) {
           return s + "טו";
       }

       else if(N == 16) {
           return s + "טז";
       }

       while(N >= aValues[i]) {
           s += sAlefBet[i];
           N -= aValues[i];
       }

       -- i;
   }

   return s;
}

function printPrakim() {
    $("psalm").each((i, elt) => {
        $(elt).prepend($(`<chapter id="psalm-${i+1}">${numberToHebrew(i + 1)}</chapter>`));

        if ( i % 10 === 0 ) {
            const anchorTitle = `${numberToHebrew(i + 1)}`;
            $(elt).prepend($(`<a class="anchor" name="${i}" title="${anchorTitle}"></a>`));
        }
    });
}
printPrakim();

function reNumberPrakimMenubar() {
  $("#menubar a").each(function (I) {
    const i = I * 10;
    const $this = $(this);
    $this.html(`&nbsp;${numberToHebrew(i + 1)}&nbsp;`);
  });

  $("chapter").each((i, elt) => {
    $(elt).text(numberToHebrew(i + 1));
  });

  window.CalJSiddurForceMenubarRefresh = true;
}

function firstWord() {
    function markFirstWord() {
        // Because of 1 psalm (77):
        // the first passuk contains a qri/ctiv,
        // so I can't simply use its plain text value. I need to
        // consider its contents() array of nodes (text & tags).
        // The first elt is always text, because the qri/ctiv is never
        // on the first word of the psalm.
        // For all other psalms, this array is just one element (text).

         const contents = $(this).contents().toArray().map(c => c.nodeType === 3 ? c.textContent : c.outerHTML);

         const firstPartOfText = contents[0];
         $(this).html(contents.join(''));

          var text = firstPartOfText.split(" ");
          var first = text.shift();
          const replacedFirstPart = (text.length > 0 ? '<matchil class="taamey">' + first + "</matchil> " : first) + text.join(" ");
          contents[0] = replacedFirstPart;

          $(this).html(contents.join(''));
    }

    $("psalm").each((i, elt) => {
        if (i != 119 - 1) {
            const $pasuk = $(elt).find("pasuk").eq(0);
            $pasuk.html(markFirstWord);
        }
    });

    $("pasuk.letter").html(markFirstWord);
}
firstWord();

$("psalms").removeClass("hide");

function debounce(callback, stabilizer, delay) {
    const initialValue = stabilizer();
    setTimeout(() => {
        if (stabilizer() === initialValue) {
            callback();
        }
    }, delay);
}

if (window.localStorage && localStorage.setItem) {
    window.addEventListener("scroll", () => {
        debounce(() => {
            const reachedPsalm = $("chapter").filter((i, e) => e.getBoundingClientRect().top >= -20).first().attr('id');
            localStorage.setItem('reachedPsalm', reachedPsalm);
        }, () => window.scrollY, 2500);
    });
}

window.postSiddur = async () => {
const psalmsOfTheDay = [
       [1,9],
       [10,17],
       [18,22],
       [23,28],
       [29,34],
       [35,38],
       [39,43],
       [44,48],
       [49,54],
       [55,59],
       [60,65],
       [66,68],
       [69,71],
       [72,76],
       [77,78],
       [79,82],
       [83,87],
       [88,89],
       [90,96],
       [97,103],
       [104,105],
       [106,107],
       [108,112],
       [113,118],
       [119, [1,96]],
       [119, [97,176]],
       [120,134],
       [135,139],
       [140,144],
       [145,150]
   ];

     async function calcPsalmOfTheDay(explicitDayNum, explicitMonthLength) {

         const {todaysDay: dayToday, monthLength} =
           explicitDayNum ? {todaysDay: explicitDayNum, monthLength: explicitMonthLength} : await siddurContext;
         let psalmOfTheDayStart;
         let psalmOfTheDayEnd;
         let withpasuk = false;
         let p119Section;
         let anchor;
         let range;

         if ((dayToday === 29) && (monthLength === 29)) {
             psalmOfTheDayStart = psalmsOfTheDay[29 - 1][0];
             psalmOfTheDayEnd = psalmsOfTheDay[30- 1][1];
             anchor = `psalm-${psalmOfTheDayStart}`;
             range = () => `${numberToHebrew(psalmOfTheDayStart)} - ${numberToHebrew(psalmOfTheDayEnd)}`;
         } else if ((dayToday === 25) || (dayToday === 26)) {
             withpasuk = true;
             psalmOfTheDayStart = 119;
             psalmOfTheDayEnd = 119;
             p119Section = dayToday - 25; //0 or 1
             anchor = p119Section === 1 ? 'psalm-119-1' : 'psalm-119';
             if (p119Section === 0) {
                 range = () => `${numberToHebrew(psalmOfTheDayStart)} : ${numberToHebrew(1)} - ${numberToHebrew(96)}`;
             } else {
                 range = () => `${numberToHebrew(psalmOfTheDayStart)} : ${numberToHebrew(97)} - ${numberToHebrew(176)}`;
             }
         } else {
             psalmOfTheDayStart = psalmsOfTheDay[dayToday - 1][0];
             psalmOfTheDayEnd = psalmsOfTheDay[dayToday - 1][1];
             anchor = `psalm-${psalmOfTheDayStart}`;
             range = () => `${numberToHebrew(psalmOfTheDayStart)} - ${numberToHebrew(psalmOfTheDayEnd)}`;
         }

         return {
             anchor,
             range,
             withpasuk,
             p119Section,
             psalmOfTheDayStart,
             psalmOfTheDayEnd
         };
     }

    function markPsalmOfTheDay({withpasuk, p119Section, psalmOfTheDayStart, psalmOfTheDayEnd}) {
      if (! withpasuk) {
         for(let i = psalmOfTheDayStart; i <= psalmOfTheDayEnd; ++ i) {
             $("psalm").eq(i - 1).addClass("ofTheDay");
         }
      } else {
         const $119 = $("psalm").eq(119 - 1);
         $119.find("p").eq(p119Section).addClass("ofTheDay");
      }
    }

    function extractTehilimNumberFromExtraParam(extraParam) {
        const extraParamNumberMatch = extraParam && extraParam.match( /^([1-9]|([12][0-9])|(30))\/((29)|(30))$/ );
        if (extraParamNumberMatch) {
            $("psalms").addClass("differentDay");
        }
        const extraParamDayValue = extraParamNumberMatch?.[1];
        const extraParamMonthLength = extraParamNumberMatch?.[4];
        return [extraParamDayValue && parseInt(extraParamDayValue), extraParamMonthLength && parseInt(extraParamMonthLength)];
    }

       const {extraParam} = await siddurContext;
       const [extraParamDayValue, extraParamMonthLength] = extractTehilimNumberFromExtraParam(extraParam);

     const calculatedPsalmOfTheDay = await calcPsalmOfTheDay(extraParamDayValue, extraParamMonthLength);
     const { anchor, range } = calculatedPsalmOfTheDay;
     markPsalmOfTheDay(calculatedPsalmOfTheDay);

     if (window.localStorage && localStorage.getItem) {
       const reachedPsalm =
       extraParam ? anchor : (
           localStorage.getItem('jumpAnchor') || localStorage.getItem('reachedPsalm')
       );
       localStorage.removeItem('jumpAnchor');
       if (reachedPsalm) {
         setTimeout(() => {
            window.scrollTo(0, $(`#${reachedPsalm}`).position().top - $("#menubar").height() - 10);
         }, 500);
       }
     }

     function makeTableToc() {
       const $tableToc = $("#tableToc");
       $tableToc.empty();
       for (let i = 0; i < 15; ++ i) {
         for (let j = 0; j < 10; ++ j) {
           const psalmNo = 10 * i + j + 1;
           const $cell = $(`<div><a href="#psalm-${psalmNo}" class="tocPsalmNo">${numberToHebrew(psalmNo)}</a></div>`);
           $tableToc.append($cell);
         }
       }
     }
     makeTableToc();

     $(".btn-numbering").click(() => {
        displayHebrewNumbers = !displayHebrewNumbers;
        makeTableToc();
        reNumberPrakimMenubar();
        $(".tehilimHayomRange").text(range());
        localStorage.setItem('displayHebrewNumbers', displayHebrewNumbers ? 'true' : 'false');
     });

     $(".tehilimHayomRange").text(range());

     $("#tableToc").on("click", ".tocPsalmNo", function() {
         const $a = $(this);
         $("#psalmSelector").addClass("hide");
         window.scrollTo(0, $($a.attr("href")).position().top - 50);
         return false;
     });

     const closeOverlayTefila = () => {
        $("#overlay-tefila").css("display", "none");
        window.caljOnClickBack = () => 0;
        return 1;
     };

     $(".btn-psalm-tefila").click((e) => {
       const $that = $(e.target);
       const kind = $that.data("kind");
       const $clonedText = $(`.tefila-wrap.${kind}`).children().clone();
       $("#overlay-tefila").css("display", "block");
       $("#psalmSelector").addClass("hide");
       $("#overlay-teilfa-content").empty().append($clonedText);
       $("#overlay-teilfa-content").find("collapsible").addClass("expanded").css("height", "initial");
       $("#overlay-tefila").scrollTop(0);
       window.caljOnClickBack = closeOverlayTefila;
       $("#overlay-tefila headline").click(closeOverlayTefila);
       $("#overlay-tefila .tefila-wrap-close").click(closeOverlayTefila);
       return false;
     });

     $("#btnHamburger").click(() => {
       $("#psalmSelector").toggleClass("hide");
       window.caljOnClickBack = () => {
         if ($("#psalmSelector").hasClass("hide")) {
           return 0;
         }
         $("#psalmSelector").toggleClass("hide");
         window.caljOnClickBack = () => 0;
         return 1;
       }
     });
     $(".linkPsalmOfTheDay").click(() => {
         $("#psalmSelector").addClass("hide");
         window.scrollTo(0, $(`#${anchor}`).position().top - $("#menubar").height() - 10);
         return false;
     });
 };
