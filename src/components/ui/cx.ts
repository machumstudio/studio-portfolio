// className 조합. 거짓 값은 버린다
export const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");
