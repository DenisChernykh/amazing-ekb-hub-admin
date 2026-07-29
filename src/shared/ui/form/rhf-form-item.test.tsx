import { useZodForm } from "@/shared/lib/form/use-zod-form";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, Input } from "antd";
import { FormProvider } from "react-hook-form";
import { z } from "zod";
import { describe, expect, it, vi } from "vitest";
import { RhfFormItem } from "./rhf-form-item";

const schema = z.strictObject({
  title: z.string().trim().min(1, "Введите название"),
});

function TestForm({ onSubmit }: { onSubmit: (value: { title: string }) => void }) {
  const form = useZodForm(schema, {
    defaultValues: { title: "" },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
        <RhfFormItem control={form.control} label="Название" name="title" required>
          {(field, controlProps) => <Input {...field} {...controlProps} />}
        </RhfFormItem>
        <Button htmlType="submit">Сохранить</Button>
      </form>
    </FormProvider>
  );
}

describe("RhfFormItem", () => {
  it("connects a required field error to its control and submits a valid value", async () => {
    const onSubmit = vi.fn();

    render(<TestForm onSubmit={onSubmit} />);

    const input = screen.getByLabelText("Название");
    await userEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(await screen.findByText("Введите название")).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");

    const errorId = input.getAttribute("aria-describedby");
    expect(errorId).toBeTruthy();
    expect(document.getElementById(errorId ?? "")).toHaveTextContent(
      "Введите название",
    );

    await userEvent.type(input, "SPA");

    await waitFor(() => {
      expect(screen.queryByText("Введите название")).not.toBeInTheDocument();
      expect(input).toHaveAttribute("aria-invalid", "false");
      expect(input).not.toHaveAttribute("aria-describedby");
    });

    await userEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(onSubmit).toHaveBeenCalledWith({ title: "SPA" }, expect.anything());
  });
});
