export const cppKeywords = [
  'int', 'long', 'double', 'float', 'char', 'bool', 'string', 'void', 'auto', 'const', 'static',
  'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue', 'return',
  'class', 'struct', 'public', 'private', 'protected', 'template', 'typename', 'using', 'typedef',
  'new', 'delete', 'this', 'nullptr', 'true', 'false', 'sizeof', 'operator', 'friend', 'virtual',
  
  'vector', 'array', 'deque', 'list', 'forward_list', 'stack', 'queue', 'priority_queue',
  'set', 'multiset', 'map', 'multimap', 'unordered_set', 'unordered_map', 'bitset',
  
  'push_back', 'pop_back', 'push_front', 'pop_front', 'insert', 'erase', 'clear', 'size', 'empty',
  'front', 'back', 'top', 'begin', 'end', 'rbegin', 'rend', 'cbegin', 'cend', 'crbegin', 'crend',
  'find', 'count', 'lower_bound', 'upper_bound', 'equal_range', 'at', 'operator[]', 'resize', 'reserve',
  'capacity', 'shrink_to_fit', 'assign', 'swap', 'merge', 'sort', 'reverse', 'unique', 'remove',
  
  'sort', 'stable_sort', 'partial_sort', 'nth_element', 'binary_search', 'lower_bound', 'upper_bound',
  'equal_range', 'merge', 'inplace_merge', 'includes', 'set_union', 'set_intersection', 'set_difference',
  'set_symmetric_difference', 'next_permutation', 'prev_permutation', 'reverse', 'rotate', 'shuffle',
  'unique', 'remove', 'remove_if', 'replace', 'replace_if', 'fill', 'fill_n', 'generate', 'generate_n',
  'transform', 'copy', 'copy_if', 'copy_n', 'copy_backward', 'move', 'move_backward', 'swap_ranges',
  'iter_swap', 'swap', 'reverse_copy', 'rotate_copy', 'unique_copy', 'remove_copy', 'remove_copy_if',
  'replace_copy', 'replace_copy_if', 'fill_n', 'generate_n', 'transform', 'for_each', 'count', 'count_if',
  'mismatch', 'equal', 'is_permutation', 'search', 'search_n', 'find', 'find_if', 'find_if_not',
  'find_end', 'find_first_of', 'adjacent_find', 'min', 'max', 'minmax', 'min_element', 'max_element',
  'minmax_element', 'lexicographical_compare', 'is_sorted', 'is_sorted_until', 'is_heap', 'is_heap_until',
  'all_of', 'any_of', 'none_of', 'accumulate', 'inner_product', 'adjacent_difference', 'partial_sum',
  
  'length', 'size', 'empty', 'clear', 'resize', 'reserve', 'capacity', 'shrink_to_fit', 'at', 'operator[]',
  'front', 'back', 'push_back', 'pop_back', 'append', 'operator+=', 'assign', 'insert', 'erase', 'replace',
  'substr', 'copy', 'swap', 'find', 'rfind', 'find_first_of', 'find_last_of', 'find_first_not_of',
  'find_last_not_of', 'compare', 'stoi', 'stol', 'stoul', 'stoll', 'stoull', 'stof', 'stod', 'stold',
  'to_string', 'c_str', 'data', 'get_allocator',
  
  'cin', 'cout', 'cerr', 'clog', 'endl', 'flush', 'getline', 'scanf', 'printf', 'sprintf', 'sscanf',
  'fopen', 'fclose', 'fscanf', 'fprintf', 'fgets', 'fputs', 'fread', 'fwrite', 'feof', 'ferror',
  
  'abs', 'fabs', 'labs', 'llabs', 'div', 'ldiv', 'lldiv', 'ceil', 'floor', 'round', 'trunc', 'fmod',
  'remainder', 'remquo', 'fma', 'fmax', 'fmin', 'fdim', 'nan', 'nanf', 'nanl', 'exp', 'exp2', 'expm1',
  'log', 'log10', 'log2', 'log1p', 'pow', 'sqrt', 'cbrt', 'hypot', 'sin', 'cos', 'tan', 'asin', 'acos',
  'atan', 'atan2', 'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh', 'erf', 'erfc', 'tgamma', 'lgamma',
  'ceil', 'floor', 'trunc', 'round', 'nearbyint', 'rint', 'lrint', 'llrint', 'frexp', 'ldexp', 'modf',
  'scalbn', 'scalbln', 'ilogb', 'logb', 'nextafter', 'nexttoward', 'copysign', 'fpclassify', 'isfinite',
  'isinf', 'isnan', 'isnormal', 'signbit', 'isgreater', 'isgreaterequal', 'isless', 'islessequal',
  'islessgreater', 'isunordered',
  
  'dfs', 'bfs', 'dijkstra', 'floyd', 'kruskal', 'prim', 'union', 'find', 'gcd', 'lcm', 'mod', 'pow',
  'factorial', 'combination', 'permutation', 'prime', 'sieve', 'binary_search', 'ternary_search',
  'two_pointers', 'sliding_window', 'prefix_sum', 'suffix_sum', 'segment_tree', 'fenwick_tree',
  'sparse_table', 'lca', 'hld', 'centroid', 'articulation', 'bridge', 'scc', 'topological_sort',
  
  'n', 'm', 'k', 't', 'ans', 'sum', 'count', 'result', 'temp', 'left', 'right', 'mid', 'start', 'end',
  'pos', 'idx', 'i', 'j', 'x', 'y', 'a', 'b', 'c', 'd', 'u', 'v', 'w', 'weight', 'cost', 'dist',
  
  'solve', 'main', 'input', 'output', 'process', 'calculate', 'compute', 'check', 'valid', 'isValid',
  'can', 'possible', 'impossible', 'true', 'false', 'yes', 'no', 'init', 'build', 'query', 'update'
]; 