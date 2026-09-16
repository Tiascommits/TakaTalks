import { describe, expect, it } from "vitest";
import { buildEmbedUrl, buildFacebookEmbedUrl, buildYoutubeEmbedUrl } from "./embed";

describe("buildFacebookEmbedUrl", () => {
  it("wraps a Facebook share URL in the video plugin iframe URL", () => {
    const shareUrl = "https://www.facebook.com/share/v/19SFrZz1mm/";
    const embed = buildFacebookEmbedUrl(shareUrl);
    expect(embed).toBe(
      "https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fshare%2Fv%2F19SFrZz1mm%2F&show_text=false"
    );
  });
});

describe("buildYoutubeEmbedUrl", () => {
  it("extracts the video ID from a watch URL", () => {
    expect(buildYoutubeEmbedUrl("https://www.youtube.com/watch?v=abc123XYZ")).toBe(
      "https://www.youtube.com/embed/abc123XYZ"
    );
  });

  it("extracts the video ID from a shortened youtu.be URL", () => {
    expect(buildYoutubeEmbedUrl("https://youtu.be/abc123XYZ")).toBe(
      "https://www.youtube.com/embed/abc123XYZ"
    );
  });

  it("extracts the video ID from a Shorts URL", () => {
    expect(buildYoutubeEmbedUrl("https://www.youtube.com/shorts/abc123XYZ")).toBe(
      "https://www.youtube.com/embed/abc123XYZ"
    );
  });

  it("throws when no video ID can be found", () => {
    expect(() => buildYoutubeEmbedUrl("https://www.youtube.com/watch")).toThrow();
  });
});

describe("buildEmbedUrl", () => {
  it("dispatches to the Facebook builder", () => {
    expect(buildEmbedUrl("facebook", "https://www.facebook.com/share/v/19SFrZz1mm/")).toContain(
      "facebook.com/plugins/video.php"
    );
  });

  it("dispatches to the YouTube builder", () => {
    expect(buildEmbedUrl("youtube", "https://www.youtube.com/watch?v=abc123XYZ")).toBe(
      "https://www.youtube.com/embed/abc123XYZ"
    );
  });
});
