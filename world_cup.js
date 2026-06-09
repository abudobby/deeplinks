import fs from 'fs';

const url = 'https://x.com/i/api/graphql/mjP9fB_MpScfXblKwpTDBg/SearchTimeline?variables=%7B%22rawQuery%22%3A%22world%20cup%22%2C%22count%22%3A20%2C%22querySource%22%3A%22typeahead_click%22%2C%22product%22%3A%22Top%22%2C%22withGrokTranslatedBio%22%3Atrue%2C%22withQuickPromoteEligibilityTweetFields%22%3Afalse%7D&features=%7B%22rweb_video_screen_enabled%22%3Afalse%2C%22rweb_cashtags_enabled%22%3Atrue%2C%22profile_label_improvements_pcf_label_in_post_enabled%22%3Atrue%2C%22responsive_web_profile_redirect_enabled%22%3Afalse%2C%22rweb_tipjar_consumption_enabled%22%3Afalse%2C%22verified_phone_label_enabled%22%3Afalse%2C%22creator_subscriptions_tweet_preview_api_enabled%22%3Atrue%2C%22responsive_web_graphql_timeline_navigation_enabled%22%3Atrue%2C%22responsive_web_graphql_skip_user_profile_image_extensions_enabled%22%3Afalse%2C%22premium_content_api_read_enabled%22%3Afalse%2C%22communities_web_enable_tweet_community_results_fetch%22%3Atrue%2C%22c9s_tweet_anatomy_moderator_badge_enabled%22%3Atrue%2C%22responsive_web_grok_analyze_button_fetch_trends_enabled%22%3Afalse%2C%22responsive_web_grok_analyze_post_followups_enabled%22%3Atrue%2C%22rweb_cashtags_composer_attachment_enabled%22%3Atrue%2C%22responsive_web_jetfuel_frame%22%3Atrue%2C%22responsive_web_grok_share_attachment_enabled%22%3Atrue%2C%22responsive_web_grok_annotations_enabled%22%3Atrue%2C%22articles_preview_enabled%22%3Atrue%2C%22responsive_web_edit_tweet_api_enabled%22%3Atrue%2C%22rweb_conversational_replies_downvote_enabled%22%3Afalse%2C%22graphql_is_translatable_rweb_tweet_is_translatable_enabled%22%3Atrue%2C%22view_counts_everywhere_api_enabled%22%3Atrue%2C%22longform_notetweets_consumption_enabled%22%3Atrue%2C%22responsive_web_twitter_article_tweet_consumption_enabled%22%3Atrue%2C%22content_disclosure_indicator_enabled%22%3Atrue%2C%22content_disclosure_ai_generated_indicator_enabled%22%3Atrue%2C%22responsive_web_grok_show_grok_translated_post%22%3Atrue%2C%22responsive_web_grok_analysis_button_from_backend%22%3Atrue%2C%22post_ctas_fetch_enabled%22%3Atrue%2C%22freedom_of_speech_not_reach_fetch_enabled%22%3Atrue%2C%22standardized_nudges_misinfo%22%3Atrue%2C%22tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled%22%3Atrue%2C%22longform_notetweets_rich_text_read_enabled%22%3Atrue%2C%22longform_notetweets_inline_media_enabled%22%3Afalse%2C%22responsive_web_grok_image_annotation_enabled%22%3Atrue%2C%22responsive_web_grok_imagine_annotation_enabled%22%3Atrue%2C%22responsive_web_grok_community_note_auto_translation_is_enabled%22%3Atrue%2C%22responsive_web_enhance_cards_enabled%22%3Afalse%7D';

const headers = {
  'Host': 'x.com',
  'x-twitter-active-user': 'yes',
  'Accept': '*/*',
  'Authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
  'x-client-transaction-id': 'GQgoQlDQ1DMbrEzLvpkVsMebA3YPfDkGw60C0VJLVt7TViZVyNt7K0DnruhnvuKcAhfywRwK6ac9fVTmG82qYj2p8/5oGg',
  'Sec-Fetch-Site': 'same-origin',
  'x-twitter-client-language': 'en',
  'Sec-Fetch-Mode': 'cors',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Safari/605.1.15',
  'Referer': 'https://x.com/search?q=world%20cup&src=typeahead_click',
  'x-csrf-token': '806f14cab27aba6489872030850c7b0a94989c076bb7dfb457c1ecf14f283873e5c08520386e39708e25769fe2e3bc7961c815e9e030bc532e747f8a4953a426ef65e945a64bc619102cc4f299771aa8',
  'x-twitter-auth-type': 'OAuth2Session',
  'Sec-Fetch-Dest': 'empty',
  'Accept-Language': 'en-US,en;q=0.9',
  'Priority': 'u=3, i',
  'Connection': 'keep-alive',
  'Content-Type': 'application/json',
  'Cookie': 'twid=u%3D1910860413362688000; guest_id_ads=v1%3A176805967099478346; guest_id_marketing=v1%3A176805967099478346; _twitter_sess=BAh7BiIKZmxhc2hJQzonQWN0aW9uQ29udHJvbGxlcjo6Rmxhc2g6OkZsYXNoSGFzaHsABjoKQHVzZWR7AA%253D%253D--1164b91ac812d853b877e93ddb612b7471bebc74; __cuid=e7de3a11-78d4-4341-9e26-b34a542f22bb; __cf_bm=nfbHxEhqk1l69e7NADo45JrpZinS8awH1OzC0n_pZrs-1781025778.0462434-1.0.1.1-XRI0xutAoM6utFojHQAjtKX.Ev_e3LgMUnPsAksaCyZ1y8wyyKimTuD31SnNXNlN7ABa80Azy7z2hyqNScocjHiBsWFki56cp4hrfga.h5gng67MeqrFPdUmXv_JniH2; cf_clearance=V6sXuFxICwFZC7o5gPYcqY079h5M1lFYYUKPp97r9T8-1781022560-1.2.1.1-3AN9M4sUTavq5i.AgEuljALYpovtcIiMUg3kcEb0VdOXCFhjXsz7CWZV2Uc4HcPmZsJyGH34tRx7XkFnjo5T51CIq6luwFPWQA1fi9Ojs5acQCdK5GN0RuRF8JIjovKIU5B8H8lNbnE9E26scQs.3Ammr8..kKexeRKMUbBeKwiK4s0nRCd31mWRMHLZBNc5lf.nIxD3SDAK6FdA7IAizgCxYdb8vp08X8EiMUJbpgpnofsndejCiC7OM4e9iAU.01ZsG2b9Y02l718rnQyKepRoj5uohhQO.BDqyNuNdrdHwGdpF04vKfNzGJRayrDQZ5kkaxd5G5O0g_xjpW7bTw; external_referer=padhuUp37zjgzgv1mFWxJ12Ozwit7owX|0|8e8t2xd8A2w%3D; lang=en; personalization_id="v1_AqOnEraTyX/m3sU4nHoC1g=="; auth_token=9f227d2d131935115410bc35d1bf65ebda695bf1; ct0=806f14cab27aba6489872030850c7b0a94989c076bb7dfb457c1ecf14f283873e5c08520386e39708e25769fe2e3bc7961c815e9e030bc532e747f8a4953a426ef65e945a64bc619102cc4f299771aa8; kdt=JPazy5mis5UusAlbr9omajtnVzZFxnH3NoeVgMRo; guest_id=v1%3A176805967099478346',
};

async function fetchWorldCupTimeline() {
  try {
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    const instructions = data?.data?.search_by_raw_query?.search_timeline?.timeline?.instructions ?? [];
    const entries = instructions.flatMap(i => i.entries ?? []);

    const videos = entries.flatMap(entry => {
      const result = entry?.content?.itemContent?.tweet_results?.result;
      const tweet = result?.__typename === 'TweetWithVisibilityResults' ? result.tweet : result;
      if (!tweet) return [];

      const legacy = tweet.legacy;
      const media = legacy?.extended_entities?.media ?? [];

      return media
        .filter(m => {
          if (m.type !== 'video') return false;
          const durationMs = m.video_info?.duration_millis ?? 0;
          if (durationMs < 30000) return false;
          const [w, h] = m.video_info?.aspect_ratio ?? [0, 0];
          return w > h;
        })
        .flatMap(m => {
          const hls = m.video_info?.variants?.find(v => v.content_type === 'application/x-mpegURL');
          if (!hls) return [];
          return [{ title: legacy.full_text, url: hls.url, thumbnail: m.media_url_https }];
        });
    });

    fs.writeFileSync('world_cup_previews.json', JSON.stringify(videos, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

fetchWorldCupTimeline();
