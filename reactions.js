#!/usr/bin/env node
import { writeFileSync } from "fs";


const accounts = [
  { username: "FTFonFS1",  userId: "895014043932540928" },
  { username: "FirstTake", userId: "26588937" },
];

const FEATURES = "%7B%22rweb_video_screen_enabled%22%3Afalse%2C%22profile_label_improvements_pcf_label_in_post_enabled%22%3Atrue%2C%22responsive_web_profile_redirect_enabled%22%3Afalse%2C%22rweb_tipjar_consumption_enabled%22%3Afalse%2C%22verified_phone_label_enabled%22%3Afalse%2C%22creator_subscriptions_tweet_preview_api_enabled%22%3Atrue%2C%22responsive_web_graphql_timeline_navigation_enabled%22%3Atrue%2C%22responsive_web_graphql_skip_user_profile_image_extensions_enabled%22%3Afalse%2C%22premium_content_api_read_enabled%22%3Afalse%2C%22communities_web_enable_tweet_community_results_fetch%22%3Atrue%2C%22c9s_tweet_anatomy_moderator_badge_enabled%22%3Atrue%2C%22responsive_web_grok_analyze_button_fetch_trends_enabled%22%3Afalse%2C%22responsive_web_grok_analyze_post_followups_enabled%22%3Atrue%2C%22responsive_web_jetfuel_frame%22%3Atrue%2C%22responsive_web_grok_share_attachment_enabled%22%3Atrue%2C%22responsive_web_grok_annotations_enabled%22%3Atrue%2C%22articles_preview_enabled%22%3Atrue%2C%22responsive_web_edit_tweet_api_enabled%22%3Atrue%2C%22graphql_is_translatable_rweb_tweet_is_translatable_enabled%22%3Atrue%2C%22view_counts_everywhere_api_enabled%22%3Atrue%2C%22longform_notetweets_consumption_enabled%22%3Atrue%2C%22responsive_web_twitter_article_tweet_consumption_enabled%22%3Atrue%2C%22tweet_awards_web_tipping_enabled%22%3Afalse%2C%22content_disclosure_indicator_enabled%22%3Atrue%2C%22content_disclosure_ai_generated_indicator_enabled%22%3Atrue%2C%22responsive_web_grok_show_grok_translated_post%22%3Atrue%2C%22responsive_web_grok_analysis_button_from_backend%22%3Atrue%2C%22post_ctas_fetch_enabled%22%3Atrue%2C%22freedom_of_speech_not_reach_fetch_enabled%22%3Atrue%2C%22standardized_nudges_misinfo%22%3Atrue%2C%22tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled%22%3Atrue%2C%22longform_notetweets_rich_text_read_enabled%22%3Atrue%2C%22longform_notetweets_inline_media_enabled%22%3Atrue%2C%22responsive_web_grok_image_annotation_enabled%22%3Atrue%2C%22responsive_web_grok_imagine_annotation_enabled%22%3Atrue%2C%22responsive_web_grok_community_note_auto_translation_is_enabled%22%3Afalse%2C%22responsive_web_enhance_cards_enabled%22%3Afalse%7D";

const FIELD_TOGGLES = "%7B%22withArticlePlainText%22%3Afalse%7D";

const BASE_HEADERS = {
  "Content-Type": "application/json",
  Accept: "*/*",
  Authorization:
    "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
  "Sec-Fetch-Site": "same-origin",
  "Accept-Language": "en-US,en;q=0.9",
  "Sec-Fetch-Mode": "cors",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Safari/605.1.15",
  "Sec-Fetch-Dest": "empty",
  // ── Paste your own session cookies/tokens below ──────────────────────────
  Cookie:
    "twid=u%3D1910860413362688000; __cuid=8591d43a40ee4586b573a41233f5d5ff; guest_id_ads=v1%3A176805967099478346; guest_id_marketing=v1%3A176805967099478346; auth_token=9f227d2d131935115410bc35d1bf65ebda695bf1; ct0=806f14cab27aba6489872030850c7b0a94989c076bb7dfb457c1ecf14f283873e5c08520386e39708e25769fe2e3bc7961c815e9e030bc532e747f8a4953a426ef65e945a64bc619102cc4f299771aa8; kdt=JPazy5mis5UusAlbr9omajtnVzZFxnH3NoeVgMRo; guest_id=v1%3A176805967099478346; lang=en; personalization_id=\"v1_AqOnEraTyX/m3sU4nHoC1g==\"",
  "x-twitter-active-user": "yes",
  "x-twitter-auth-type": "OAuth2Session",
  "x-client-transaction-id":
    "MQ48yB1FqHzVq0zgemfBbaj7i0Ub2R/UtDjPCzVcH1s2d+1ZhWZYXWUBguh6KUekrKZyaDSjWcWTpqkk/3XeJIgWmEgeMg",
  "x-twitter-client-language": "en",
  "x-csrf-token":
    "806f14cab27aba6489872030850c7b0a94989c076bb7dfb457c1ecf14f283873e5c08520386e39708e25769fe2e3bc7961c815e9e030bc532e747f8a4953a426ef65e945a64bc619102cc4f299771aa8",
};

function extractVideos(obj, results = [], seen = new Set()) {
  if (!obj || typeof obj !== "object") return results;

  if (Array.isArray(obj)) {
    for (const item of obj) extractVideos(item, results, seen);
    return results;
  }

  const legacy = obj.legacy;
  if (legacy?.created_at && legacy?.extended_entities?.media) {
    for (const media of legacy.extended_entities.media) {
      if (media.video_info?.variants) {
        const hls = media.video_info.variants.find(
          (v) => v.content_type === "application/x-mpegURL" && v.url
        );
        if (hls) {
          const url = hls.url.split("?")[0];
          if (!seen.has(url)) {
            seen.add(url);

            // Pick the largest thumbnail available
            const thumbnail = media.media_url_https
              ? `${media.media_url_https}?format=jpg&name=large`
              : null;

            results.push({
              url,
              thumbnail,
                title: legacy.full_text ?? "",
              date: new Date(legacy.created_at),
              durationMs: media.video_info.duration_millis ?? null,
            });
          }
        }
      }
    }
  }

  for (const v of Object.values(obj)) extractVideos(v, results, seen);
  return results;
}

async function fetchVideosForUser(username, userId) {
  const variables = `%7B%22userId%22%3A%22${userId}%22%2C%22count%22%3A20%2C%22includePromotedContent%22%3Atrue%2C%22withQuickPromoteEligibilityTweetFields%22%3Atrue%2C%22withVoice%22%3Atrue%7D`;

  const url =
    "https://x.com/i/api/graphql/N9_71NodX1yntoC5pa4IFw/UserTweets?" +
    `variables=${variables}` +
    `&features=${FEATURES}` +
    `&fieldToggles=${FIELD_TOGGLES}`;

  const headers = {
    ...BASE_HEADERS,
    Referer: `https://x.com/${username}`,
  };

  console.log(`Fetching tweets for @${username}…`);

  try {
    const res = await fetch(url, { method: "GET", headers });

    if (!res.ok) {
      console.error(`[${username}] HTTP ${res.status} ${res.statusText}`);
      const body = await res.text();
      console.error(body.slice(0, 500));
      return [];
    }

    const data = await res.json();
    const videos = extractVideos(data).map((v) => ({ ...v, account: username }));
    console.log(`[${username}] Found ${videos.length} video(s)`);
    return videos;
  } catch (err) {
    console.error(`[${username}] Fetch failed:`, err.message);
    return [];
  }
}

async function main() {
  const allVideos = (
    await Promise.all(
      accounts.map(({ username, userId }) => fetchVideosForUser(username, userId))
    )
  )
    .flat()
    .sort((a, b) => b.date - a.date); // latest first across all accounts

    writeFileSync("reactions.json", JSON.stringify(allVideos, null, 2));
  console.log("\nResults written to videos.json");

  return allVideos;
}

main();