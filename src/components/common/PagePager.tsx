import {Pagination} from 'antd';

import type {PageMeta} from '@/types';

interface Props {
    page: PageMeta;
    onChange: (page: number) => void;
    simple?: boolean;
}

export function PagePager({page, onChange, simple = false}: Props) {
    if (page.total === 0) return null;

    return (
        <div style={{display: 'flex', justifyContent: 'center', marginTop: 16}}>
            <Pagination
                current={page.page}
                pageSize={page.size}
                total={page.total}
                simple={simple}
                showSizeChanger={false}
                onChange={onChange}
            />
        </div>
    );
}
