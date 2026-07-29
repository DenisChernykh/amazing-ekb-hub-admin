import { z } from "zod";
import "./zod-locale";

describe("zod locale", () => {
  it("uses the Russian locale for built-in validation issues", () => {
    const result = z.string().min(3).safeParse("");

    expect(result.error?.issues[0]?.message).toBe(
      "Слишком маленькое значение: ожидалось, что string будет иметь >=3 символа",
    );
  });
});
