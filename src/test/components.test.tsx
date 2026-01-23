import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

describe("Button Component", () => {
  it("should render with default variant", () => {
    const { getByRole, getByText } = render(<Button>Click me</Button>);
    expect(getByRole("button")).toBeInTheDocument();
    expect(getByText("Click me")).toBeInTheDocument();
  });

  it("should handle click events", () => {
    const handleClick = vi.fn();
    const { getByRole } = render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should be disabled when disabled prop is true", () => {
    const { getByRole } = render(<Button disabled>Disabled</Button>);
    expect(getByRole("button")).toBeDisabled();
  });

  it("should render different variants", () => {
    const { getByRole, getByText, rerender } = render(<Button variant="default">Default</Button>);
    expect(getByRole("button")).toBeInTheDocument();

    rerender(<Button variant="destructive">Destructive</Button>);
    expect(getByText("Destructive")).toBeInTheDocument();

    rerender(<Button variant="outline">Outline</Button>);
    expect(getByText("Outline")).toBeInTheDocument();

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(getByText("Secondary")).toBeInTheDocument();

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(getByText("Ghost")).toBeInTheDocument();

    rerender(<Button variant="link">Link</Button>);
    expect(getByText("Link")).toBeInTheDocument();
  });

  it("should render different sizes", () => {
    const { getByRole, getByText, rerender } = render(<Button size="default">Default</Button>);
    expect(getByRole("button")).toBeInTheDocument();

    rerender(<Button size="sm">Small</Button>);
    expect(getByText("Small")).toBeInTheDocument();

    rerender(<Button size="lg">Large</Button>);
    expect(getByText("Large")).toBeInTheDocument();

    rerender(<Button size="icon">Icon</Button>);
    expect(getByText("Icon")).toBeInTheDocument();
  });
});

describe("Badge Component", () => {
  it("should render with text", () => {
    const { getByText } = render(<Badge>New</Badge>);
    expect(getByText("New")).toBeInTheDocument();
  });

  it("should render different variants", () => {
    const { getByText, rerender } = render(<Badge variant="default">Default</Badge>);
    expect(getByText("Default")).toBeInTheDocument();

    rerender(<Badge variant="secondary">Secondary</Badge>);
    expect(getByText("Secondary")).toBeInTheDocument();

    rerender(<Badge variant="destructive">Destructive</Badge>);
    expect(getByText("Destructive")).toBeInTheDocument();

    rerender(<Badge variant="outline">Outline</Badge>);
    expect(getByText("Outline")).toBeInTheDocument();
  });
});

describe("Card Component", () => {
  it("should render card with content", () => {
    const { getByText } = render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Card content goes here</p>
        </CardContent>
      </Card>
    );

    expect(getByText("Card Title")).toBeInTheDocument();
    expect(getByText("Card content goes here")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { getByTestId } = render(<Card className="custom-class" data-testid="card">Content</Card>);
    expect(getByTestId("card")).toHaveClass("custom-class");
  });
});

describe("Accessibility", () => {
  it("should have accessible button labels", () => {
    const { getByRole } = render(<Button aria-label="Close dialog">X</Button>);
    expect(getByRole("button", { name: "Close dialog" })).toBeInTheDocument();
  });

  it("should support keyboard navigation on buttons", () => {
    const handleClick = vi.fn();
    const { getByRole } = render(<Button onClick={handleClick}>Press Enter</Button>);
    
    const button = getByRole("button");
    button.focus();
    
    fireEvent.keyDown(button, { key: "Enter" });
    expect(document.activeElement).toBe(button);
  });
});
