import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SvgArtifact } from "@/components/artifacts/svg-artifact";

describe("SvgArtifact", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sanitizes the SVG before sending it to the image-pass endpoint", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        enabled: false,
        error: "Image pass is disabled in tests.",
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    render(
      <SvgArtifact
        artifact={{
          identifier: "svg-1",
          type: "svg",
          title: "Polarity Diagram",
          content:
            "<svg onload='window.bad=1'><script>window.hacked=1</script><circle onclick=alert(1) /></svg>",
          attributes: {},
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Generate illustration via Nano Banana/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const request = fetchMock.mock.calls[0]?.[1] as { body?: string };
    const payload = JSON.parse(request.body ?? "{}") as { svg?: string };

    expect(payload.svg).toContain("<svg");
    expect(payload.svg).not.toContain("<script");
    expect(payload.svg).not.toContain("onload=");
    expect(payload.svg).not.toContain("onclick=");
    expect(screen.getByText("Image pass skipped: Image pass is disabled in tests.")).toBeInTheDocument();
  });

  it("renders the enhanced image when the image pass succeeds", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        enabled: true,
        model: "mock-model",
        image: {
          dataUrl: "data:image/png;base64,abc123",
          mediaType: "image/png",
        },
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    render(
      <SvgArtifact
        artifact={{
          identifier: "svg-2",
          type: "svg",
          title: "Cable Layout",
          content: '<svg><rect width="10" height="10" /></svg>',
          attributes: {},
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Generate illustration via Nano Banana/i }));

    const enhancedImage = await screen.findByAltText("Cable Layout — enhanced");
    expect(enhancedImage).toHaveAttribute("src", "data:image/png;base64,abc123");
    expect(screen.getByText("Generated via mock-model (image/png)")).toBeInTheDocument();
  });
});
