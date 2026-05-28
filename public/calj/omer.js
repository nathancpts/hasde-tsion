window.prepareSensitiveBlocks = async ({
    omerNumber,
    omerWords,
    isDay,
    sefiraDay,
    sefiraWeek,
    nisuach,
}) => {

    removeIf(isDay, ".hideWhenDay");

    $("#omernumber").text(omerNumber);
    $("#omerwords").text(omerWords);
    $(".sefiraday").text(sefiraDay);
    $(".sefiraweek").text(sefiraWeek);

    $(`.nisuach`).addClass("hidden");
    $(`.nisuach-${nisuach}`).removeClass("hidden");

    $(".btn-toggle-nisuach").click(() => {
        $(`.nisuach-${nisuach}`).addClass("hidden");
        nisuach = nisuach === "ishMatsliach" ? "patachEliyahu" : "ishMatsliach";
        $(`.nisuach-${nisuach}`).removeClass("hidden");

        CalJJSInterface.setNisuach(nisuach);
    });
};
