// supabase/migrations 의 테이블 모양. supabase-js 의 select/insert 칼럼 이름을 타입으로 검사한다.
// `supabase gen types` 는 --db-url 로 쓰려면 Docker 가 필요해서 손으로 맞춘다. 마이그레이션을 바꾸면 여기도 바꾼다
export type WorkRow = {
  id: string;
  slug: string;
  title_ko: string;
  title_en: string;
  category: string;
  year_month: string;
  published: boolean;
  created_at: string;
};

export type WorkImageRow = {
  work_id: string;
  sort_order: number;
  src: string;
  alt_ko: string;
  alt_en: string;
  is_cover: boolean;
};

export type InquiryRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  message: string;
  received_at: string;
  status: string;
  status_changed_at: string | null;
};

type Table<Row, Insert, Relationships extends Relationship[] = []> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Insert>;
  Relationships: Relationships;
};

type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

export type Database = {
  public: {
    Tables: {
      works: Table<WorkRow, Omit<WorkRow, "created_at">>;
      work_images: Table<
        WorkImageRow,
        WorkImageRow,
        [
          {
            foreignKeyName: "work_images_work_id_fkey";
            columns: ["work_id"];
            isOneToOne: false;
            referencedRelation: "works";
            referencedColumns: ["id"];
          },
        ]
      >;
      inquiries: Table<InquiryRow, InquiryRow>;
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
