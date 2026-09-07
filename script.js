(function($) { // Thanks to BrunoLM (https://stackoverflow.com/a/3855394)
    $.QueryString = (function(paramsArray) {
        let params = {};

        for (let i = 0; i < paramsArray.length; ++i) {
            let param = paramsArray[i]
                .split('=', 2);

            if (param.length !== 2)
                continue;

            params[param[0]] = decodeURIComponent(param[1].replace(/\+/g, " "));
        }

        return params;
    })(window.location.search.substr(1).split('&'))
})(jQuery);

Chat = {
    info: {
        channel: null,
        channelID: null,
        animate: ('animate' in $.QueryString ? ($.QueryString.animate.toLowerCase() === 'true') : false),
        showBots: ('bots' in $.QueryString ? ($.QueryString.bots.toLowerCase() === 'true') : false),
        hideCommands: ('hide_commands' in $.QueryString ? ($.QueryString.hide_commands.toLowerCase() === 'true') : false),
        hideBadges: ('hide_badges' in $.QueryString ? ($.QueryString.hide_badges.toLowerCase() === 'true') : false),
        fade: ('fade' in $.QueryString ? parseInt($.QueryString.fade) : false),
        size: ('size' in $.QueryString ? parseInt($.QueryString.size) : 3),
        font: ('font' in $.QueryString ? parseInt($.QueryString.font) : 0),
        stroke: ('stroke' in $.QueryString ? parseInt($.QueryString.stroke) : false),
        shadow: ('shadow' in $.QueryString ? parseInt($.QueryString.shadow) : false),
        smallCaps: ('small_caps' in $.QueryString ? ($.QueryString.small_caps.toLowerCase() === 'true') : false),
        background: ('bg' in $.QueryString ? $.QueryString.bg : false),
        customFont: ('custom_font' in $.QueryString ? $.QueryString.custom_font : false),
        emoteScale: ('emote_scale' in $.QueryString ? parseFloat($.QueryString.emote_scale) : false),
        caps: ('caps' in $.QueryString ? ($.QueryString.caps.toLowerCase() === 'true') : false),
        nlAfterName: ('nl' in $.QueryString ? ($.QueryString.nl.toLowerCase() === 'true') : false),
        hideUsernames: ('hide_usernames' in $.QueryString ? ($.QueryString.hide_usernames.toLowerCase() === 'true') : false),
        demo: ('demo' in $.QueryString ? ($.QueryString.demo.toLowerCase() === 'true') : false),
        events: ('events' in $.QueryString ? ($.QueryString.events.toLowerCase() === 'true') : true),
        highlights: ('highlights' in $.QueryString ? ($.QueryString.highlights.toLowerCase() === 'true') : true),
        mention: ('mention' in $.QueryString ? ($.QueryString.mention.toLowerCase() === 'true') : true),
        timestamps: ('timestamps' in $.QueryString ? ($.QueryString.timestamps.toLowerCase() === 'true') : false),
        links: ('links' in $.QueryString ? ($.QueryString.links.toLowerCase() === 'true') : false),
        pronouns: ('pronouns' in $.QueryString ? ($.QueryString.pronouns.toLowerCase() === 'true') : false),
        paints: ('paints' in $.QueryString ? ($.QueryString.paints.toLowerCase() === 'true') : true),
        filter: ('filter' in $.QueryString ? $.QueryString.filter.toLowerCase().split(',').filter(function(w) { return w.trim().length > 0; }) : false),
        seventvEmoteSetID: null,
        seventvPaints: {},
        seventvBadgeDefs: {},
        seventvUserCosmetics: {},
        pronounsMap: null,
        userPronouns: {},
        emotes: {},
        badges: {},
        userBadges: {},
        ffzapBadges: null,
        bttvBadges: null,
        seventvBadges: null,
        chatterinoBadges: null,
        cheers: {},
        lines: [],
        blockedUsers: ('block' in $.QueryString ? $.QueryString.block.toLowerCase().split(',') : false),
        bots: ['streamelements', 'streamlabs', 'nightbot', 'moobot', 'fossabot']
    },

    loadEmotes: function(channelID) {
        Chat.info.emotes = {};
        // Load BTTV, FFZ and 7TV emotes (global sets only when no channel ID, e.g. demo mode)
        (channelID ? ['emotes/global', 'users/twitch/' + encodeURIComponent(channelID)] : ['emotes/global']).forEach(endpoint => {
            $.getJSON('https://api.betterttv.net/3/cached/frankerfacez/' + endpoint).done(function(res) {
                res.forEach(emote => {
                    if (emote.images['4x']) {
                        var imageUrl = emote.images['4x'];
                        var upscale = false;
                    } else {
                        var imageUrl = emote.images['2x'] || emote.images['1x'];
                        var upscale = true;
                    }
                    Chat.info.emotes[emote.code] = {
                        id: emote.id,
                        image: imageUrl,
                        upscale: upscale
                    };
                });
            });
        });

        (channelID ? ['emotes/global', 'users/twitch/' + encodeURIComponent(channelID)] : ['emotes/global']).forEach(endpoint => {
            $.getJSON('https://api.betterttv.net/3/cached/' + endpoint).done(function(res) {
                if (!Array.isArray(res)) {
                    res = res.channelEmotes.concat(res.sharedEmotes);
                }
                res.forEach(emote => {
                    Chat.info.emotes[emote.code] = {
                        id: emote.id,
                        image: 'https://cdn.betterttv.net/emote/' + emote.id + '/3x',
                        zeroWidth: ["5e76d338d6581c3724c0f0b2", "5e76d399d6581c3724c0f0b8", "567b5b520e984428652809b6", "5849c9a4f52be01a7ee5f79d", "567b5c080e984428652809ba", "567b5dc00e984428652809bd", "58487cc6f52be01a7ee5f205", "5849c9c8f52be01a7ee5f79e"].includes(emote.id) // cvHazmat, cvMask, SoSnowy, IceCold, CandyCane, ReinDeer, SantaHat, TopHat
                    };
                });
            });
        });

        // 7TV v3 API (v2 was shut down)
        $.getJSON('https://7tv.io/v3/emote-sets/global').done(function(res) {
            (res.emotes || []).forEach(Chat.addSevenTVEmote);
        });
        if (channelID) {
            $.getJSON('https://7tv.io/v3/users/twitch/' + encodeURIComponent(channelID))
                .done(function(res) {
                    if (res.emote_set) {
                        Chat.info.seventvEmoteSetID = res.emote_set.id;
                        (res.emote_set.emotes || []).forEach(Chat.addSevenTVEmote);
                    }
                    if (Chat.sevenTVStarted) Chat.resubscribeSevenTVSet();
                    else Chat.startSevenTV();
                })
                .fail(function() {
                    Chat.startSevenTV();
                });
        }
    },

    addSevenTVEmote: function(emote) {
        var host = emote.data && emote.data.host;
        if (!host || !host.url || typeof emote.name !== 'string') return;
        var base = host.url.indexOf('//') === 0 ? 'https:' + host.url : host.url;
        var files = (host.files || []).filter(function(f) { return f.format === 'WEBP' && typeof f.name === 'string'; });
        if (files.length === 0) return;
        var image = base + '/' + files[files.length - 1].name;
        // EventAPI payloads are untrusted network data: only clean https URLs become <img src>
        if (!/^https:\/\//.test(image) || /["'<>\s\\]/.test(image)) return;
        Chat.info.emotes[emote.name] = {
            id: emote.id,
            image: image,
            zeroWidth: !!((emote.flags & 1) || (emote.data.flags & 256))
        };
    },

    // 7TV EventAPI: live emote updates, name paints and 7TV badges
    startSevenTV: function() {
        if (Chat.sevenTVStarted || !Chat.info.channelID || Chat.info.demo) return;
        Chat.sevenTVStarted = true;
        var connect = function() {
            var ws;
            try { ws = new WebSocket('wss://events.7tv.io/v3'); } catch (e) { return; }
            Chat.sevenTVSocket = ws;
            ws.onopen = function() {
                var sub = function(type, condition) { ws.send(JSON.stringify({ op: 35, d: { type: type, condition: condition } })); };
                if (Chat.info.seventvEmoteSetID) {
                    sub('emote_set.update', { object_id: Chat.info.seventvEmoteSetID });
                    Chat.sevenTVSubscribedSet = Chat.info.seventvEmoteSetID;
                }
                if (Chat.info.paints) {
                    var cond = { ctx: 'channel', platform: 'TWITCH', id: String(Chat.info.channelID) };
                    sub('cosmetic.create', cond);
                    sub('entitlement.create', cond);
                }
            };
            ws.onmessage = function(e) {
                var msg;
                try { msg = JSON.parse(e.data); } catch (err) { return; }
                if (msg.op !== 0 || !msg.d || !msg.d.body) return;
                Chat.handleSevenTVEvent(msg.d.type, msg.d.body);
            };
            ws.onclose = function() { Chat.sevenTVSubscribedSet = null; setTimeout(connect, 5000); };
        };
        connect();
    },

    // Re-point the live emote_set subscription when the channel's active set changes
    // (e.g. !refreshoverlay after the streamer swapped sets on 7tv.app)
    resubscribeSevenTVSet: function() {
        var ws = Chat.sevenTVSocket;
        if (!ws || ws.readyState !== 1 || Chat.sevenTVSubscribedSet === Chat.info.seventvEmoteSetID) return;
        if (Chat.sevenTVSubscribedSet) ws.send(JSON.stringify({ op: 36, d: { type: 'emote_set.update', condition: { object_id: Chat.sevenTVSubscribedSet } } }));
        if (Chat.info.seventvEmoteSetID) ws.send(JSON.stringify({ op: 35, d: { type: 'emote_set.update', condition: { object_id: Chat.info.seventvEmoteSetID } } }));
        Chat.sevenTVSubscribedSet = Chat.info.seventvEmoteSetID;
    },

    handleSevenTVEvent: function(type, body) {
        try {
            if (type === 'emote_set.update') {
                (body.pushed || []).forEach(function(c) {
                    if (c.key === 'emotes' && c.value) Chat.addSevenTVEmote(c.value);
                });
                (body.pulled || []).forEach(function(c) {
                    if (c.key === 'emotes' && c.old_value && c.old_value.name) delete Chat.info.emotes[c.old_value.name];
                });
                (body.updated || []).forEach(function(c) {
                    if (c.key !== 'emotes') return;
                    if (c.old_value && c.old_value.name) delete Chat.info.emotes[c.old_value.name];
                    if (c.value) Chat.addSevenTVEmote(c.value);
                });
                console.log('kChat: 7TV emotes updated live');
            } else if (type === 'cosmetic.create' && body.object) {
                var obj = body.object;
                if (obj.kind === 'PAINT' && obj.data) Chat.storeSevenTVPaint(obj.data.id || obj.id, obj.data);
                if (obj.kind === 'BADGE' && obj.data) {
                    var host = obj.data.host;
                    var burl = host && host.url ? (host.url.indexOf('//') === 0 ? 'https:' + host.url : host.url) + '/3x' : null;
                    if (burl) Chat.info.seventvBadgeDefs[obj.data.id || obj.id] = { tooltip: obj.data.tooltip || obj.data.name, url: burl };
                }
            } else if (type === 'entitlement.create' && body.object) {
                var ent = body.object;
                if (!ent.user || !ent.ref_id || (ent.kind !== 'PAINT' && ent.kind !== 'BADGE')) return;
                var conn = (ent.user.connections || []).filter(function(c) { return c.platform === 'TWITCH'; })[0];
                if (!conn) return;
                [String(conn.username || '').toLowerCase(), String(conn.id || '')].forEach(function(key) {
                    if (!key) return;
                    Chat.info.seventvUserCosmetics[key] = Chat.info.seventvUserCosmetics[key] || {};
                    Chat.info.seventvUserCosmetics[key][ent.kind] = ent.ref_id;
                });
            }
        } catch (e) { /* malformed event payloads must never kill the chat */ }
    },

    storeSevenTVPaint: function(id, p) {
        try {
            var toColor = function(c) {
                if (typeof c !== 'number' || !isFinite(c)) return null;
                c = c >>> 0;
                return 'rgba(' + ((c >>> 24) & 255) + ',' + ((c >>> 16) & 255) + ',' + ((c >>> 8) & 255) + ',' + (Math.round((c & 255) / 255 * 100) / 100) + ')';
            };
            var css = {};
            // Every stop must be fully valid — a single bad value would make the whole
            // gradient invalid CSS and leave the username transparent (invisible)
            var stopList = (p.stops || []).map(function(s) {
                var col = toColor(s && s.color);
                var at = Number(s && s.at);
                return (col !== null && isFinite(at)) ? col + ' ' + Math.round(at * 100) + '%' : null;
            });
            var stops = (stopList.length && stopList.indexOf(null) === -1) ? stopList.join(', ') : '';
            var angle = Number(p.angle);
            if (!isFinite(angle)) angle = 90;
            if (p.function === 'LINEAR_GRADIENT' && stops) css.image = (p.repeat ? 'repeating-' : '') + 'linear-gradient(' + angle + 'deg, ' + stops + ')';
            else if (p.function === 'RADIAL_GRADIENT' && stops) css.image = (p.repeat ? 'repeating-' : '') + 'radial-gradient(circle, ' + stops + ')';
            else if (p.function === 'URL' && typeof p.image_url === 'string' && /^https:\/\//.test(p.image_url) && !/["'<>\s\\)]/.test(p.image_url)) css.image = 'url("' + p.image_url + '")';
            else if (p.color !== null && p.color !== undefined) css.color = toColor(p.color);
            if (p.shadows && p.shadows.length) {
                var shadowList = p.shadows.map(function(s) {
                    var col = toColor(s && s.color);
                    var x = Number(s && s.x_offset), y = Number(s && s.y_offset), r = Number(s && s.radius);
                    return (col !== null && isFinite(x) && isFinite(y) && isFinite(r))
                        ? 'drop-shadow(' + x + 'px ' + y + 'px ' + r + 'px ' + col + ')' : null;
                });
                if (shadowList.length && shadowList.indexOf(null) === -1) css.filter = shadowList.join(' ');
            }
            if (css.image || css.color) Chat.info.seventvPaints[id] = css;
        } catch (e) { /* skip unparseable paints */ }
    },

    loadUserPronouns: function(nick) {
        Chat.info.userPronouns[nick] = true; // pending
        $.getJSON('https://api.pronouns.alejo.io/v1/users/' + encodeURIComponent(nick))
            .done(function(res) {
                var p = res && Chat.info.pronounsMap && Chat.info.pronounsMap[res.pronoun_id];
                Chat.info.userPronouns[nick] = p ? (p.singular ? p.subject : p.subject + '/' + p.object) : false;
            })
            .fail(function() { Chat.info.userPronouns[nick] = false; });
    },

    // Everything that needs the numeric channel ID, resolved from the IRC ROOMSTATE tag
    loadChannelData: function(channelID) {
        Chat.loadEmotes(channelID);

        $.getJSON('https://api.frankerfacez.com/v1/_room/id/' + encodeURIComponent(channelID)).done(function(res) {
            if (res.room.moderator_badge) {
                Chat.info.badges['moderator:1'] = 'https://cdn.frankerfacez.com/room-badge/mod/' + Chat.info.channel + '/4/rounded';
            }
            if (res.room.vip_badge) {
                Chat.info.badges['vip:1'] = 'https://cdn.frankerfacez.com/room-badge/vip/' + Chat.info.channel + '/4';
            }
        });
    },

    load: function(callback) {
        // Background: ?bg=dark | ?bg=181818 (hex, no #). Default stays transparent for overlay use.
        if (Chat.info.background) {
            var bgNames = { dark: '#18181b', twitch: '#18181b', black: '#000000', gray: '#2f2f35', grey: '#2f2f35', light: '#efeff1' };
            var bg = Chat.info.background.toLowerCase();
            var hex = bg.replace(/[^0-9a-f]/g, '');
            if (bgNames[bg]) document.body.style.background = bgNames[bg];
            else if (hex.length === 3 || hex.length === 6) document.body.style.background = '#' + hex;
        }

        // Load CSS
        let size = sizes[Chat.info.size - 1];
        let font = fonts[Chat.info.font];

        appendCSS('size', size);
        appendCSS('font', font);

        if (Chat.info.stroke && Chat.info.stroke > 0) {
            let stroke = strokes[Chat.info.stroke - 1];
            appendCSS('stroke', stroke);
        }
        if (Chat.info.shadow && Chat.info.shadow > 0) {
            let shadow = shadows[Chat.info.shadow - 1];
            appendCSS('shadow', shadow);
        }
        if (Chat.info.smallCaps) {
            appendCSS('variant', 'SmallCaps');
        }

        var extraCSS = '';
        if (Chat.info.customFont) {
            extraCSS += '.chat_line { font-family: "' + Chat.info.customFont.replace(/["<>]/g, '') + '", sans-serif !important; }\n';
        }
        if (Chat.info.emoteScale && Chat.info.emoteScale > 0) {
            extraCSS += 'img.emote, img.emoji, img.cheer_emote { zoom: ' + Chat.info.emoteScale + '; }\n';
        }
        if (Chat.info.caps) {
            extraCSS += '.message { text-transform: uppercase; }\n';
        }
        if (Chat.info.nlAfterName) {
            extraCSS += '.message { display: block; }\n';
        }
        if (Chat.info.hideUsernames) {
            extraCSS += '.nick, .colon { display: none; }\n';
        }
        if (extraCSS) {
            $('<style></style>').text(extraCSS).appendTo('head');
        }

        // Twitch badges via IVR (badges.twitch.tv and Kraken are gone; Helix needs auth).
        // Channel badges load after global so they override. Chat works fine if IVR is down.
        $.getJSON('https://api.ivr.fi/v2/twitch/badges/global')
            .done(function(global) {
                global.forEach(set => {
                    set.versions.forEach(v => {
                        Chat.info.badges[set.set_id + ':' + v.id] = v.image_url_4x;
                    });
                });
                $.getJSON('https://api.ivr.fi/v2/twitch/badges/channel?login=' + encodeURIComponent(Chat.info.channel)).done(function(channel) {
                    channel.forEach(set => {
                        set.versions.forEach(v => {
                            Chat.info.badges[set.set_id + ':' + v.id] = v.image_url_4x;
                        });
                    });
                });
            });

        if (!Chat.info.hideBadges) {
            $.getJSON('https://api.ffzap.com/v1/supporters')
                .done(function(res) {
                    Chat.info.ffzapBadges = res;
                })
                .fail(function() {
                    Chat.info.ffzapBadges = [];
                });
            $.getJSON('https://api.betterttv.net/3/cached/badges')
                .done(function(res) {
                    Chat.info.bttvBadges = res;
                })
                .fail(function() {
                    Chat.info.bttvBadges = [];
                });

            // 7TV badges/paints moved to their EventAPI; REST endpoint is gone. TODO: EventAPI support.
            Chat.info.seventvBadges = [];

            $.getJSON('https://api.chatterino.com/badges')
                .done(function(res) {
                    Chat.info.chatterinoBadges = res.badges;
                })
                .fail(function() {
                    Chat.info.chatterinoBadges = [];
                });
        }

        // Cheermotes needed the Kraken API; without auth there is no public source, so
        // bits messages simply render as text. Chat.info.cheers stays empty.

        if (Chat.info.pronouns) {
            $.getJSON('https://api.pronouns.alejo.io/v1/pronouns')
                .done(function(res) { Chat.info.pronounsMap = res; })
                .fail(function() { Chat.info.pronounsMap = {}; });
        }

        callback(true);
    },

    update: setInterval(function() {
        if (Chat.info.lines.length > 0) {
            var lines = Chat.info.lines.join('');

            if (Chat.info.animate) {
                var $auxDiv = $('<div></div>', { class: "hidden" }).appendTo("#chat_container");
                $auxDiv.append(lines);
                var auxHeight = $auxDiv.height();
                $auxDiv.remove();

                var $animDiv = $('<div></div>');
                $('#chat_container').append($animDiv);
                $animDiv.animate({ "height": auxHeight }, 150, function() {
                    $(this).remove();
                    $('#chat_container').append(lines);
                });
            } else {
                $('#chat_container').append(lines);
            }
            Chat.info.lines = [];
            var linesToDelete = $('.chat_line').length - 100;
            while (linesToDelete > 0) {
                $('.chat_line').eq(0).remove();
                linesToDelete--;
            }
        } else if (Chat.info.fade) {
            var messageTime = $('.chat_line').eq(0).data('time');
            if ((Date.now() - messageTime) / 1000 >= Chat.info.fade) {
                $('.chat_line').eq(0).fadeOut(function() {
                    $(this).remove();
                });
            }
        }
    }, 200),

    loadUserBadges: function(nick, userId) {
        Chat.info.userBadges[nick] = [];
        $.getJSON('https://api.frankerfacez.com/v1/user/' + nick).always(function(res) {
            if (res.badges) {
                Object.entries(res.badges).forEach(badge => {
                    var userBadge = {
                        description: badge[1].title,
                        url: 'https:' + badge[1].urls['4'],
                        color: badge[1].color
                    };
                    if (!Chat.info.userBadges[nick].includes(userBadge)) Chat.info.userBadges[nick].push(userBadge);
                });
            }
            Chat.info.ffzapBadges.forEach(user => {
                if (user.id.toString() === userId) {
                    var color = '#755000';
                    if (user.tier == 2) color = (user.badge_color || '#755000');
                    else if (user.tier == 3) {
                        if (user.badge_is_colored == 0) color = (user.badge_color || '#755000');
                        else color = false;
                    }
                    var userBadge = {
                        description: 'FFZ:AP Badge',
                        url: 'https://api.ffzap.com/v1/user/badge/' + userId + '/3',
                        color: color
                    };
                    if (!Chat.info.userBadges[nick].includes(userBadge)) Chat.info.userBadges[nick].push(userBadge);
                }
            });
            Chat.info.bttvBadges.forEach(user => {
                if (user.name === nick) {
                    var userBadge = {
                        description: user.badge.description,
                        url: user.badge.svg
                    };
                    if (!Chat.info.userBadges[nick].includes(userBadge)) Chat.info.userBadges[nick].push(userBadge);
                }
            });
            Chat.info.seventvBadges.forEach(badge => {
                badge.users.forEach(user => {
                    if (user === nick) {
                        var userBadge = {
                            description: badge.tooltip,
                            url: badge.urls[2][1]
                        };
                        if (!Chat.info.userBadges[nick].includes(userBadge)) Chat.info.userBadges[nick].push(userBadge);
                    }
                });
            });
            Chat.info.chatterinoBadges.forEach(badge => {
                badge.users.forEach(user => {
                    if (user === userId) {
                        var userBadge = {
                            description: badge.tooltip,
                            url: badge.image3 || badge.image2 || badge.image1
                        };
                        if (!Chat.info.userBadges[nick].includes(userBadge)) Chat.info.userBadges[nick].push(userBadge);
                    }
                });
            });
        });
    },

    write: function(nick, info, message) {
        if (info) {
            var $chatLine = $('<div></div>');
            $chatLine.addClass('chat_line');
            $chatLine.attr('data-nick', nick);
            $chatLine.attr('data-time', Date.now());
            $chatLine.attr('data-id', info.id);
            if (Chat.info.highlights) {
                if (info['first-msg'] === '1') $chatLine.addClass('first_msg');
                if (info['msg-id'] === 'highlighted-message') $chatLine.addClass('highlighted');
            }
            if (Chat.info.mention && Chat.info.channel && message.toLowerCase().indexOf('@' + Chat.info.channel) > -1) {
                $chatLine.addClass('mentioned');
            }
            var $userInfo = $('<span></span>');
            $userInfo.addClass('user_info');
            if (Chat.info.timestamps) {
                var now = new Date();
                $userInfo.append($('<span></span>').addClass('timestamp')
                    .text(('0' + now.getHours()).slice(-2) + ':' + ('0' + now.getMinutes()).slice(-2)));
            }
            if (Chat.info.pronouns) {
                var pronoun = Chat.info.userPronouns[nick];
                if (typeof pronoun === 'string') $userInfo.append($('<span></span>').addClass('pronoun').text(pronoun));
            }

            // Writing badges
            if (Chat.info.hideBadges) {
                if (typeof(info.badges) === 'string') {
                    info.badges.split(',').forEach(badge => {
                        var $badge = $('<img/>');
                        $badge.addClass('badge');
                        badge = badge.split('/');
                        $badge.attr('src', Chat.info.badges[badge[0] + ':' + badge[1]]);
                        $userInfo.append($badge);
                    });
                }
            } else {
                var badges = [];
                const priorityBadges = ['predictions', 'admin', 'global_mod', 'staff', 'twitchbot', 'broadcaster', 'moderator', 'vip'];
                if (typeof(info.badges) === 'string') {
                    info.badges.split(',').forEach(badge => {
                        badge = badge.split('/');
                        var priority = (priorityBadges.includes(badge[0]) ? true : false);
                        badges.push({
                            description: badge[0],
                            url: Chat.info.badges[badge[0] + ':' + badge[1]],
                            priority: priority
                        });
                    });
                }
                var $modBadge;
                badges.forEach(badge => {
                    if (badge.priority) {
                        var $badge = $('<img/>');
                        $badge.addClass('badge');
                        $badge.attr('src', badge.url);
                        if (badge.description === 'moderator') $modBadge = $badge;
                        $userInfo.append($badge);
                    }
                });
                if (Chat.info.userBadges[nick]) {
                    Chat.info.userBadges[nick].forEach(badge => {
                        var $badge = $('<img/>');
                        $badge.addClass('badge');
                        if (badge.color) $badge.css('background-color', badge.color);
                        if (badge.description === 'Bot' && info.mod === '1') {
                            $badge.css('background-color', 'rgb(0, 173, 3)');
                            if ($modBadge) $modBadge.remove();
                        }
                        $badge.attr('src', badge.url);
                        $userInfo.append($badge);
                    });
                }
                badges.forEach(badge => {
                    if (!badge.priority) {
                        var $badge = $('<img/>');
                        $badge.addClass('badge');
                        $badge.attr('src', badge.url);
                        $userInfo.append($badge);
                    }
                });
            }

            // Writing username
            var $username = $('<span></span>');
            $username.addClass('nick');
            if (typeof(info.color) === 'string') {
                if (tinycolor(info.color).getBrightness() <= 50) var color = tinycolor(info.color).lighten(30);
                else var color = info.color;
            } else {
                const twitchColors = ["#FF0000", "#0000FF", "#008000", "#B22222", "#FF7F50", "#9ACD32", "#FF4500", "#2E8B57", "#DAA520", "#D2691E", "#5F9EA0", "#1E90FF", "#FF69B4", "#8A2BE2", "#00FF7F"];
                var color = twitchColors[nick.charCodeAt(0) % 15];
            }
            $username.css('color', color);
            $username.text(typeof info['display-name'] === 'string' && info['display-name'] ? info['display-name'] : nick);

            // 7TV cosmetics (paint + badge) from the EventAPI, keyed by login or user id
            if (Chat.info.paints) {
                var cosmetics = Chat.info.seventvUserCosmetics[nick] || Chat.info.seventvUserCosmetics[info['user-id']];
                if (cosmetics) {
                    var paint = cosmetics.PAINT && Chat.info.seventvPaints[cosmetics.PAINT];
                    if (paint) {
                        if (paint.image) {
                            $username.css('background-image', paint.image);
                            // Only hide the base color once the browser accepted the
                            // gradient — otherwise the name would turn invisible
                            if ($username[0].style.backgroundImage) {
                                $username.css({ 'background-size': 'cover', '-webkit-background-clip': 'text', 'background-clip': 'text', 'color': 'transparent' });
                            }
                        } else if (paint.color) $username.css('color', paint.color);
                        if (paint.filter) $username.css('filter', paint.filter);
                    }
                    var stvBadge = cosmetics.BADGE && Chat.info.seventvBadgeDefs[cosmetics.BADGE];
                    if (stvBadge && !Chat.info.hideBadges) {
                        $userInfo.append($('<img/>').addClass('badge').attr('src', stvBadge.url).attr('title', stvBadge.tooltip || ''));
                    }
                }
            }
            $userInfo.append($username);

            // Writing message
            var $message = $('<span></span>');
            $message.addClass('message');
            if (/^\x01ACTION.*\x01$/.test(message)) {
                $message.css('color', color);
                message = message.replace(/^\x01ACTION/, '').replace(/\x01$/, '').trim();
                $userInfo.append('<span>&nbsp;</span>');
            } else {
                $userInfo.append('<span class="colon">:</span>');
            }
            $chatLine.append($userInfo);

            // Replacing emotes and cheers
            var replacements = {};
            if (typeof(info.emotes) === 'string') {
                info.emotes.split('/').forEach(emoteData => {
                    var twitchEmote = emoteData.split(':');
                    var indexes = twitchEmote[1].split(',')[0].split('-');
                    var emojis = new RegExp('[က-￿]+', 'g');
                    var aux = message.replace(emojis, ' ');
                    var emoteCode = aux.substr(indexes[0], indexes[1] - indexes[0] + 1);
                    replacements[emoteCode] = '<img class="emote" src="https://static-cdn.jtvnw.net/emoticons/v2/' + escapeAttr(twitchEmote[0]) + '/default/dark/3.0" />';
                });
            }

            Object.entries(Chat.info.emotes).forEach(emote => {
                if (message.search(escapeRegExp(emote[0])) > -1) {
                    if (emote[1].upscale) replacements[emote[0]] = '<img class="emote upscale" src="' + escapeAttr(emote[1].image) + '" />';
                    else if (emote[1].zeroWidth) replacements[emote[0]] = '<img class="emote" data-zw="true" src="' + escapeAttr(emote[1].image) + '" />';
                    else replacements[emote[0]] = '<img class="emote" src="' + escapeAttr(emote[1].image) + '" />';
                }
            });

            message = escapeHtml(message);

            if (Chat.info.links) {
                // Non-ASCII excluded: twemoji later string-replaces emoji even inside
                // attribute values, which would corrupt an href containing one
                message = message.replace(/(https?:\/\/[^\s<>"'\u0080-\uFFFF]+)/gi, function(url) {
                    return '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + url + '</a>';
                });
            }

            if (info.bits && parseInt(info.bits) > 0) {
                var bits = parseInt(info.bits);
                var parsed = false;
                for (cheerType of Object.entries(Chat.info.cheers)) {
                    var regex = new RegExp(cheerType[0] + "\\d+\\s*", 'ig');
                    if (message.search(regex) > -1) {
                        message = message.replace(regex, '');

                        if (!parsed) {
                            var closest = 1;
                            for (cheerTier of Object.keys(cheerType[1]).map(Number).sort((a, b) => a - b)) {
                                if (bits >= cheerTier) closest = cheerTier;
                                else break;
                            }
                            message = '<img class="cheer_emote" src="' + escapeAttr(cheerType[1][closest].image) + '" /><span class="cheer_bits" style="color: ' + escapeAttr(cheerType[1][closest].color) + ';">' + bits + '</span> ' + message;
                            parsed = true;
                        }
                    }
                }
            }

            var replacementKeys = Object.keys(replacements);
            replacementKeys.sort(function(a, b) {
                return b.length - a.length;
            });

            replacementKeys.forEach(replacementKey => {
                var regex = new RegExp("(?<!\\S)(" + escapeRegExp(replacementKey) + ")(?!\\S)", 'g');
                message = message.replace(regex, replacements[replacementKey]);
            });

            message = twemoji.parse(message);
            $message.html(message);

            // Writing zero-width emotes
            messageNodes = $message.children();
            messageNodes.each(function(i) {
                if (i != 0 && $(this).data('zw') && ($(messageNodes[i - 1]).hasClass('emote') || $(messageNodes[i - 1]).hasClass('emoji')) && !$(messageNodes[i - 1]).data('zw')) {
                    var $container = $('<span></span>');
                    $container.addClass('zero-width_container');
                    $(this).addClass('zero-width');
                    $(this).before($container);
                    $container.append(messageNodes[i - 1], this);
                }
            });
            $message.html($message.html().trim());
            $chatLine.append($message);
            Chat.info.lines.push($chatLine.wrap('<div>').parent().html());
        }
    },

    // Moderation gates shared by PRIVMSG and USERNOTICE shared messages
    passesFilters: function(nick, text) {
        if (Chat.info.hideCommands && /^!.+/.test(text)) return false;
        if (!Chat.info.showBots && Chat.info.bots.includes(nick)) return false;
        if (Chat.info.blockedUsers && Chat.info.blockedUsers.includes(nick)) return false;
        if (Chat.info.filter) {
            var lower = text.toLowerCase();
            if (Chat.info.filter.some(function(w) { return lower.indexOf(w.trim()) > -1; })) return false;
        }
        return true;
    },

    // Styled inline line for subs, raids, announcements, etc.
    writeEvent: function(icon, text, kind) {
        if (!text) return;
        var $line = $('<div></div>').addClass('chat_line event_line event_' + kind).attr('data-time', Date.now());
        $line.append($('<span></span>').addClass('event_icon').text(icon));
        $line.append($('<span></span>').addClass('event_text').text(' ' + text));
        Chat.info.lines.push($line.wrap('<div>').parent().html());
    },

    clearChat: function(nick) {
        setTimeout(function() {
            $('.chat_line[data-nick=' + nick + ']').remove();
        }, 200);
    },

    clearMessage: function(id) {
        setTimeout(function() {
            $('.chat_line[data-id=' + id + ']').remove();
        }, 200);
    },

    // Preview mode for the setup page: no IRC, canned messages using real global emotes
    demo: function() {
        $(document).prop('title', 'kChat • preview');
        Chat.info.channel = 'demo';
        Chat.load(function() {
            Chat.loadEmotes(null);
            var users = [
                ['PixelPal', '#FF69B4'],
                ['StreamFan42', '#1E90FF'],
                ['ModestMod', '#2E8B57', 'moderator/1'],
                ['EmoteEnjoyer', '#DAA520'],
                ['LurkerLarry', '#8A2BE2']
            ];
            var lines = [
                'welcome to the kChat preview {e}',
                'this is what your chat will look like {e} {e}',
                'these are global emotes — your channel 7TV/BTTV/FFZ emotes load on the real page too',
                'GG {e}',
                'nice {e} 🎉'
            ];
            var i = 0;
            setTimeout(function tick() {
                var u = users[i % users.length];
                var msg = lines[i % lines.length].replace(/\{e\}/g, function() {
                    var keys = Object.keys(Chat.info.emotes);
                    return keys.length ? keys[Math.floor(Math.random() * keys.length)] : '👍';
                });
                var tags = { id: 'demo-' + i, color: u[1], 'display-name': u[0], badges: u[2] };
                if (i % lines.length === 3) tags['first-msg'] = '1';
                if (i % lines.length === 4) msg = '@demo ' + msg;
                Chat.write(u[0].toLowerCase(), tags, msg);
                if (i === 2) Chat.writeEvent('⭐', 'StreamFan42 subscribed at Tier 1. They\'ve subscribed for 3 months!', 'resub');
                if (i === 4) Chat.writeEvent('🎉', '12 raiders from PixelPal have joined!', 'raid');
                i++;
                setTimeout(tick, i < 5 ? 600 : 2500);
            }, 1200);
        });
    },

    connect: function(channel) {
        Chat.info.channel = channel;
        var title = $(document).prop('title');
        $(document).prop('title', title + Chat.info.channel);

        Chat.load(function() {
            console.log('kChat: Connecting to IRC server...');
            var socket = new ReconnectingWebSocket('wss://irc-ws.chat.twitch.tv', 'irc', { reconnectInterval: 2000 });

            socket.onopen = function() {
                console.log('kChat: Connected');
                socket.send('PASS blah\r\n');
                socket.send('NICK justinfan' + Math.floor(Math.random() * 99999) + '\r\n');
                socket.send('CAP REQ :twitch.tv/commands twitch.tv/tags\r\n');
                socket.send('JOIN #' + Chat.info.channel + '\r\n');
            };

            socket.onclose = function() {
                console.log('kChat: Disconnected');
            };

            socket.onmessage = function(data) {
                data.data.split('\r\n').forEach(line => {
                    if (!line) return;
                    var message = window.parseIRC(line);
                    if (!message.command) return;

                    switch (message.command) {
                        case "PING":
                            socket.send('PONG ' + message.params[0]);
                            return;
                        case "JOIN":
                            console.log('kChat: Joined channel #' + Chat.info.channel);
                            return;
                        case "ROOMSTATE":
                            // The room-id tag replaces the retired Kraken user lookup
                            if (!Chat.info.channelID && message.tags && message.tags['room-id']) {
                                Chat.info.channelID = message.tags['room-id'];
                                console.log('kChat: Channel ID is ' + Chat.info.channelID);
                                Chat.loadChannelData(Chat.info.channelID);
                            }
                            return;
                        case "USERNOTICE":
                            if (!Chat.info.events || !message.tags) return;
                            var eventIcons = { sub: '⭐', resub: '⭐', subgift: '🎁', submysterygift: '🎁', giftpaidupgrade: '⭐', primepaidupgrade: '⭐', anongiftpaidupgrade: '⭐', raid: '🎉', announcement: '📣' };
                            var eventId = message.tags['msg-id'];
                            if (!(eventId in eventIcons)) return;
                            var sysMsg = typeof message.tags['system-msg'] === 'string' ? message.tags['system-msg'] : '';
                            if (eventId === 'announcement' && !sysMsg) {
                                var announcer = (typeof message.tags['display-name'] === 'string' && message.tags['display-name']) || (typeof message.tags.login === 'string' ? message.tags.login : '');
                                sysMsg = announcer + ' made an announcement';
                            }
                            Chat.writeEvent(eventIcons[eventId], sysMsg, eventId);
                            if (message.params[1] && typeof message.tags.login === 'string' && Chat.passesFilters(message.tags.login, message.params[1])) {
                                Chat.write(message.tags.login, message.tags, message.params[1]);
                            }
                            return;
                        case "CLEARMSG":
                            if (message.tags) Chat.clearMessage(message.tags['target-msg-id']);
                            return;
                        case "CLEARCHAT":
                            if (message.params[1]) Chat.clearChat(message.params[1]);
                            return;
                        case "PRIVMSG":
                            if (message.params[0] !== '#' + channel || !message.params[1]) return;
                            var nick = message.prefix.split('@')[0].split('!')[0];

                            if (message.params[1].toLowerCase() === "!refreshoverlay" && typeof(message.tags.badges) === 'string') {
                                var flag = false;
                                message.tags.badges.split(',').forEach(badge => {
                                    badge = badge.split('/');
                                    if (badge[0] === "moderator" || badge[0] === "broadcaster") {
                                        flag = true;
                                        return;
                                    }
                                });
                                if (flag && Chat.info.channelID) {
                                    Chat.loadEmotes(Chat.info.channelID);
                                    console.log('kChat: Refreshing emotes...');
                                    return;
                                }
                            }

                            if (!Chat.passesFilters(nick, message.params[1])) return;

                            if (Chat.info.pronouns && !(nick in Chat.info.userPronouns)) {
                                Chat.loadUserPronouns(nick);
                            }

                            if (!Chat.info.hideBadges) {
                                if (Chat.info.bttvBadges && Chat.info.seventvBadges && Chat.info.chatterinoBadges && Chat.info.ffzapBadges && !Chat.info.userBadges[nick]) Chat.loadUserBadges(nick, message.tags['user-id']);
                            }

                            Chat.write(nick, message.tags, message.params[1]);
                            return;
                    }
                });
            };
        });
    }
};

$(document).ready(function() {
    if (Chat.info.demo) {
        Chat.demo();
        return;
    }
    if (!$.QueryString.channel) {
        window.location.replace('setup.html');
        return;
    }
    Chat.connect($.QueryString.channel.toLowerCase());
});
