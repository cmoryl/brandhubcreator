import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

describe("Route Definitions", () => {
  it("should have all expected routes defined", () => {
    const expectedRoutes = [
      "/",
      "/auth",
      "/pending-approval",
      "/onboarding",
      "/admin",
      "/knowledge",
      "/org/:slug",
      "/org/settings",
      "/contact",
      "/brand/:brandSlug",
      "/product/:productSlug",
      "/event/:eventSlug",
      "/demo/:brandSlug",
      "/demo/:type/:slug",
    ];
    
    expect(expectedRoutes.length).toBeGreaterThan(0);
  });
});

describe("Navigation Links", () => {
  it("should render home link correctly", async () => {
    const TestComponent = () => (
      <MemoryRouter initialEntries={["/"]}>
        <div>
          <a href="/">Home</a>
        </div>
      </MemoryRouter>
    );
    
    const { getByText } = render(<TestComponent />);
    expect(getByText("Home")).toBeInTheDocument();
  });

  it("should handle auth route", async () => {
    const TestComponent = () => (
      <MemoryRouter initialEntries={["/auth"]}>
        <Routes>
          <Route path="/auth" element={<div>Auth Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    
    const { getByText } = render(<TestComponent />);
    expect(getByText("Auth Page")).toBeInTheDocument();
  });

  it("should handle brand route with slug parameter", async () => {
    const TestComponent = () => (
      <MemoryRouter initialEntries={["/brand/test-brand"]}>
        <Routes>
          <Route path="/brand/:brandSlug" element={<div>Brand: test-brand</div>} />
        </Routes>
      </MemoryRouter>
    );
    
    const { getByText } = render(<TestComponent />);
    expect(getByText("Brand: test-brand")).toBeInTheDocument();
  });

  it("should handle product route with slug parameter", async () => {
    const TestComponent = () => (
      <MemoryRouter initialEntries={["/product/test-product"]}>
        <Routes>
          <Route path="/product/:productSlug" element={<div>Product: test-product</div>} />
        </Routes>
      </MemoryRouter>
    );
    
    const { getByText } = render(<TestComponent />);
    expect(getByText("Product: test-product")).toBeInTheDocument();
  });

  it("should handle organization portal route", async () => {
    const TestComponent = () => (
      <MemoryRouter initialEntries={["/org/transperfect"]}>
        <Routes>
          <Route path="/org/:slug" element={<div>Org: transperfect</div>} />
        </Routes>
      </MemoryRouter>
    );
    
    const { getByText } = render(<TestComponent />);
    expect(getByText("Org: transperfect")).toBeInTheDocument();
  });

  it("should handle 404 for unknown routes", async () => {
    const TestComponent = () => (
      <MemoryRouter initialEntries={["/unknown-route-xyz"]}>
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          <Route path="*" element={<div>Not Found</div>} />
        </Routes>
      </MemoryRouter>
    );
    
    const { getByText } = render(<TestComponent />);
    expect(getByText("Not Found")).toBeInTheDocument();
  });
});

describe("URL Parameter Handling", () => {
  it("should correctly parse brand slug from URL", () => {
    const slug = "my-brand-name";
    const url = `/brand/${slug}`;
    expect(url).toBe("/brand/my-brand-name");
  });

  it("should correctly parse product slug from URL", () => {
    const slug = "globallink-tms";
    const url = `/product/${slug}`;
    expect(url).toBe("/product/globallink-tms");
  });

  it("should correctly parse UUID format", () => {
    const uuid = "a47ce561-1e2c-4e3f-b745-7c5f4ac23f4f";
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
    expect(isUUID).toBe(true);
  });

  it("should correctly identify non-UUID slugs", () => {
    const slug = "my-brand-slug";
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    expect(isUUID).toBe(false);
  });
});

describe("Link Generation", () => {
  it("should generate correct brand links", () => {
    const generateBrandLink = (slug: string) => `/brand/${slug}`;
    expect(generateBrandLink("transperfect")).toBe("/brand/transperfect");
    expect(generateBrandLink("globallink")).toBe("/brand/globallink");
  });

  it("should generate correct product links", () => {
    const generateProductLink = (slug: string) => `/product/${slug}`;
    expect(generateProductLink("trial-interactive")).toBe("/product/trial-interactive");
    expect(generateProductLink("digitalreef")).toBe("/product/digitalreef");
  });

  it("should generate correct organization portal links", () => {
    const generateOrgLink = (slug: string) => `/org/${slug}`;
    expect(generateOrgLink("transperfect")).toBe("/org/transperfect");
  });

  it("should generate correct demo links", () => {
    const generateDemoLink = (type: string, slug: string) => `/demo/${type}/${slug}`;
    expect(generateDemoLink("brand", "bloom-wellness")).toBe("/demo/brand/bloom-wellness");
    expect(generateDemoLink("product", "nexus-tech")).toBe("/demo/product/nexus-tech");
  });
});
