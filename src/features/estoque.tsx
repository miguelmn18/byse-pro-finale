
// @ts-nocheck

import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Edit2, X, Eye } from "lucide-react";

import { FONT_BODY } from "../data/constants";
import { money, inputStyle, ghostBtn } from "../utils/helpers";
import { SectionTitle, HBar } from "../components/common";

export function Estoque({
  products = [],
  setProducts,
  onCreateProduct,
  stockLocations = [],
  setStockLocations,
  onDeleteProduct,
  onEditProduct,
  card,
  border,
  subtext,
  accent,
  text,
}) {
  /* =========================================================
     ESTADOS PRINCIPAIS
  ========================================================= */

  const [showLocations, setShowLocations] = useState(false);
  const [newLocName, setNewLocName] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState("Todas");

  const [savedCategories, setSavedCategories] = useState([]);

  const [viewingProduct, setViewingProduct] = useState(null);

  /* =========================================================
     FORMULÁRIO INICIAL
  ========================================================= */

  const blankForm = useMemo(
    () => ({
      name: "",
      category: "",
      cost: "",
      price: "",
      imposto: "",
      frete: "",
      vipPrice: "",
      vipPrice3x: "",
      barcode: "",
      code: "",
      description: "",
      controlStock: true,
      stocks: {},
      variations: [],
      imageUrl: null,
    }),
    [],
  );

  const [form, setForm] = useState(blankForm);

  /* =========================================================
     CHAVE DO LOCALSTORAGE DAS SUGESTÕES
     
     IMPORTANTE:
     As categorias de sugestão NÃO são a fonte oficial dos
     produtos. Elas existem apenas no navegador.

     A categoria oficial do produto continua sendo enviada
     normalmente para o backend através do objeto do produto.
  ========================================================= */

  const getCategoryStorageKey = () => {
    try {
      const userId =
        localStorage.getItem("byse_user_id") ||
        localStorage.getItem("userId") ||
        localStorage.getItem("byse_user") ||
        "";

      const token = localStorage.getItem("byse_token") || "";

      const userPart = String(userId || "no-user")
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, "_");

      const tokenPart = token
        ? token.slice(-24).replace(/[^a-zA-Z0-9_-]/g, "_")
        : "guest";

      return `byse_product_categories_${userPart}_${tokenPart}`;
    } catch {
      return "byse_product_categories_guest";
    }
  };

  /* =========================================================
     NORMALIZAÇÃO DE CATEGORIAS
  ========================================================= */

  const normalizeCategory = (value) => {
    return String(value || "").trim();
  };

  const isValidSuggestionCategory = (value) => {
    const normalized = normalizeCategory(value);

    if (!normalized) return false;

    if (normalized.toLowerCase() === "sem categoria") {
      return false;
    }

    return true;
  };

  const sortCategories = (categories) => {
    return Array.from(
      new Set(
        categories
          .map((category) => normalizeCategory(category))
          .filter(isValidSuggestionCategory),
      ),
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  };

  /* =========================================================
     CARREGAR CATEGORIAS DE SUGESTÃO
  ========================================================= */

  useEffect(() => {
    try {
      const key = getCategoryStorageKey();
      const raw = localStorage.getItem(key);

      if (!raw) {
        setSavedCategories([]);
        return;
      }

      const parsed = JSON.parse(raw);

      if (!Array.isArray(parsed)) {
        setSavedCategories([]);
        return;
      }

      setSavedCategories(sortCategories(parsed));
    } catch (error) {
      console.error(
        "Erro ao carregar categorias salvas no navegador:",
        error,
      );

      setSavedCategories([]);
    }
  }, []);

  /* =========================================================
     CATEGORIAS EXISTENTES NOS PRODUTOS
     
     Produtos vindos do backend também alimentam a lista
     visual de categorias.
     
     Isso NÃO significa que estamos gravando essas categorias
     automaticamente no backend.
  ========================================================= */

  const productCategories = useMemo(() => {
    return (Array.isArray(products) ? products : [])
      .map((product) => normalizeCategory(product?.category))
      .filter(isValidSuggestionCategory);
  }, [products]);

  /* =========================================================
     MANTER CATEGORIAS DOS PRODUTOS COMO SUGESTÕES LOCAIS
  ========================================================= */

  useEffect(() => {
    if (!productCategories.length) return;

    setSavedCategories((current) => {
      const merged = sortCategories([
        ...current,
        ...productCategories,
      ]);

      try {
        localStorage.setItem(
          getCategoryStorageKey(),
          JSON.stringify(merged),
        );
      } catch (error) {
        console.error(
          "Erro ao atualizar categorias no localStorage:",
          error,
        );
      }

      return merged;
    });
  }, [productCategories]);

  /* =========================================================
     SALVAR CATEGORIA COMO SUGESTÃO LOCAL
     
     Esta função NÃO altera produtos e NÃO envia nada ao backend.
  ========================================================= */

  const saveCategoryToHistory = (category) => {
    const normalized = normalizeCategory(category);

    if (!isValidSuggestionCategory(normalized)) {
      return;
    }

    setSavedCategories((current) => {
      const alreadyExists = current.some(
        (item) =>
          normalizeCategory(item).toLowerCase() ===
          normalized.toLowerCase(),
      );

      if (alreadyExists) {
        return current;
      }

      const updated = sortCategories([
        ...current,
        normalized,
      ]);

      try {
        localStorage.setItem(
          getCategoryStorageKey(),
          JSON.stringify(updated),
        );
      } catch (error) {
        console.error(
          "Erro ao salvar sugestão de categoria:",
          error,
        );
      }

      return updated;
    });
  };

  /* =========================================================
     EXCLUIR SOMENTE A SUGESTÃO DA CATEGORIA
     
     IMPORTANTE:
     NÃO altera os produtos.
     NÃO chama onEditProduct.
     NÃO chama onCreateProduct.
     NÃO remove categoria do banco.
     
     Apenas remove a sugestão do navegador.
  ========================================================= */

  const removeCategory = (categoryToRemove) => {
    const normalizedTarget =
      normalizeCategory(categoryToRemove).toLowerCase();

    if (!normalizedTarget) return;

    const confirmed = window.confirm(
      `Deseja realmente remover "${categoryToRemove}" da lista de sugestões de categorias?`,
    );

    if (!confirmed) return;

    const updatedCategories = savedCategories.filter(
      (category) =>
        normalizeCategory(category).toLowerCase() !==
        normalizedTarget,
    );

    setSavedCategories(updatedCategories);

    try {
      localStorage.setItem(
        getCategoryStorageKey(),
        JSON.stringify(updatedCategories),
      );
    } catch (error) {
      console.error(
        "Erro ao remover sugestão de categoria:",
        error,
      );
    }

    if (
      selectedCategory !== "Todas" &&
      selectedCategory.trim().toLowerCase() === normalizedTarget
    ) {
      setSelectedCategory("Todas");
    }
  };

  /* =========================================================
     TODAS AS CATEGORIAS DISPONÍVEIS PARA O FRONT
  ========================================================= */

  const allCategories = useMemo(() => {
    return sortCategories([
      ...savedCategories,
      ...productCategories,
    ]);
  }, [savedCategories, productCategories]);

  /* =========================================================
     SUGESTÕES DE CATEGORIA NO FORMULÁRIO
  ========================================================= */

  const categorySuggestions = useMemo(() => {
    const typed = normalizeCategory(form.category).toLowerCase();

    if (!typed) {
      return allCategories;
    }

    return allCategories.filter((category) =>
      category.toLowerCase().includes(typed),
    );
  }, [form.category, allCategories]);

  /* =========================================================
     LOCAIS DE ESTOQUE
  ========================================================= */

  const renameLoc = (id, name) => {
    const updatedLocations = (stockLocations || []).map((location) =>
      location.id === id
        ? {
            ...location,
            name,
          }
        : location,
    );

    setStockLocations?.(updatedLocations);
  };

  const addLoc = () => {
    const name = normalizeCategory(newLocName);

    if (!name) return;

    const newLocation = {
      id: `loc_${Date.now()}`,
      name,
    };

    const updatedLocations = [
      ...(stockLocations || []),
      newLocation,
    ];

    setStockLocations?.(updatedLocations);

    setNewLocName("");
  };

  /* =========================================================
     VARIAÇÕES
  ========================================================= */

  const addVariation = () => {
    setForm((current) => ({
      ...current,
      variations: [
        ...(current.variations || []),
        {
          id: `var_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2)}`,
          name: "",
          stocks: {},
        },
      ],
    }));
  };

  const updateVariationName = (variationId, name) => {
    setForm((current) => ({
      ...current,
      variations: (current.variations || []).map((variation) =>
        variation.id === variationId
          ? {
              ...variation,
              name,
            }
          : variation,
      ),
    }));
  };

  const updateVariationStock = (
    variationId,
    locationId,
    value,
  ) => {
    setForm((current) => ({
      ...current,
      variations: (current.variations || []).map((variation) => {
        if (variation.id !== variationId) {
          return variation;
        }

        return {
          ...variation,
          stocks: {
            ...(variation.stocks || {}),
            [locationId]: value,
          },
        };
      }),
    }));
  };

  const removeVariation = (variationId) => {
    setForm((current) => ({
      ...current,
      variations: (current.variations || []).filter(
        (variation) => variation.id !== variationId,
      ),
    }));
  };

  /* =========================================================
     EDITAR PRODUTO
  ========================================================= */

  const startEdit = (product) => {
    if (!product) return;

    setEditingId(product.id);

    const rawVariations =
      Array.isArray(product.variations)
        ? product.variations
        : Array.isArray(product.subcategories)
          ? product.subcategories
          : [];

    const parsedVariations = rawVariations.map(
      (variation, index) => ({
        id:
          variation.id ||
          `var_${index}_${Date.now()}`,
        name: variation.name || "",
        stocks: Object.fromEntries(
          Object.entries(variation.stocks || {}).map(
            ([locationId, value]) => [
              locationId,
              String(value),
            ],
          ),
        ),
      }),
    );

    setForm({
      name: product.name || "",

      category: product.category || "",

      cost:
        product.cost != null
          ? String(product.cost)
          : "",

      price:
        product.price != null
          ? String(product.price)
          : "",

      imposto:
        product.imposto != null
          ? String(product.imposto)
          : "",

      frete:
        product.frete != null
          ? String(product.frete)
          : "",

      vipPrice:
        product.vip_price != null
          ? String(product.vip_price)
          : product.vipPrice != null
            ? String(product.vipPrice)
            : "",

      vipPrice3x:
        product.vip_price_3x != null
          ? String(product.vip_price_3x)
          : product.vipPrice3x != null
            ? String(product.vipPrice3x)
            : "",

      barcode: product.barcode || "",

      code: product.code || "",

      description: product.description || "",

      controlStock:
        product.control_stock ??
        product.controlStock ??
        true,

      stocks: Object.fromEntries(
        Object.entries(product.stocks || {}).map(
          ([locationId, value]) => [
            locationId,
            String(value),
          ],
        ),
      ),

      variations: parsedVariations,

      imageUrl:
        product.image_url ||
        product.imageUrl ||
        null,
    });

    setShowForm(true);
  };

  /* =========================================================
     CANCELAR FORMULÁRIO
  ========================================================= */

  const cancelForm = () => {
    setForm(blankForm);
    setEditingId(null);
    setShowForm(false);
  };

  /* =========================================================
     IMAGEM
  ========================================================= */

  const handleImage = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setForm((current) => ({
        ...current,
        imageUrl: reader.result,
      }));
    };

    reader.readAsDataURL(file);
  };

  /* =========================================================
     PERCENTUAL SOBRE CUSTO
  ========================================================= */

  const pctOfCost = (value) => {
    const cost = parseFloat(form.cost);
    const numericValue = parseFloat(value);

    if (!cost || !numericValue) {
      return null;
    }

    return (numericValue / cost) * 100;
  };

  /* =========================================================
     SALVAR PRODUTO
  ========================================================= */

  const saveProduct = async () => {
  try {
    const name = normalizeCategory(
      form.name
    );

    const category = normalizeCategory(
      form.category
    );

    /*
     * VALIDAÇÃO DO NOME
     */
    if (!name) {
      window.alert(
        "Informe o nome do produto."
      );
      return;
    }

    /*
     * VALIDAÇÃO DO PREÇO
     */
    if (
      form.price === "" ||
      form.price == null ||
      Number.isNaN(
        parseFloat(form.price)
      )
    ) {
      window.alert(
        "Informe o preço de venda do produto."
      );
      return;
    }

    const price = parseFloat(
      form.price
    );

    if (!Number.isFinite(price) || price <= 0) {
      window.alert(
        "Informe um preço de venda válido."
      );
      return;
    }

    /*
     * VARIAÇÕES
     */
    const validatedVariations = (
      form.variations || []
    ).map((variation) => ({
      id:
        variation.id ||
        `var_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2)}`,

      name:
        normalizeCategory(
          variation.name
        ) || "Padrão",

      stocks: Object.fromEntries(
        (stockLocations || []).map(
          (location) => [
            location.id,
            parseInt(
              variation.stocks?.[
                location.id
              ],
              10
            ) || 0,
          ]
        )
      ),
    }));

    /*
     * ESTOQUE POR LOCAL
     */
    const stocksObj =
      form.controlStock
        ? Object.fromEntries(
            (stockLocations || []).map(
              (location) => [
                location.id,
                parseInt(
                  form.stocks?.[
                    location.id
                  ],
                  10
                ) || 0,
              ]
            )
          )
        : {};

    /*
     * PREÇOS VIP
     */
    const vipPrice =
      form.vipPrice !== "" &&
      form.vipPrice != null
        ? parseFloat(
            form.vipPrice
          )
        : null;

    const vipPrice3x =
      form.vipPrice3x !== "" &&
      form.vipPrice3x != null
        ? parseFloat(
            form.vipPrice3x
          )
        : null;

    /*
     * PRODUTO QUE SERÁ ENVIADO
     * AO SupplementSystem
     *
     * IMPORTANTE:
     * Produto novo NÃO recebe ID aqui.
     * O backend cria o ID.
     */
    const built = {
      ...(editingId
        ? { id: editingId }
        : {}),

      name,

      category:
        category || "Sem categoria",

      barcode:
        form.barcode || null,

      code:
        form.code || null,

      cost:
        parseFloat(form.cost) || 0,

      price,

      imposto:
        form.imposto !== ""
          ? parseFloat(
              form.imposto
            ) || 0
          : 0,

      frete:
        form.frete !== ""
          ? parseFloat(
              form.frete
            ) || 0
          : 0,

      vipPrice,

      vip_price: vipPrice,

      vipPrice3x,

      vip_price_3x:
        vipPrice3x,

      description:
        form.description || "",

      controlStock:
        Boolean(
          form.controlStock
        ),

      control_stock:
        Boolean(
          form.controlStock
        ),

      imageUrl:
        form.imageUrl || null,

      image_url:
        form.imageUrl || null,

      stocks: stocksObj,

      variations:
        validatedVariations,
    };

    console.log(
      "[ESTOQUE] PRODUTO ANTES DO ENVIO:",
      built
    );

    /*
     * =================================================
     * SALVAMENTO
     * =================================================
     *
     * setProducts recebido pelo Estoque NÃO é
     * o setter React.
     *
     * Ele é o handleUpdateProducts do pai.
     *
     * Portanto:
     *
     * CORRETO:
     * await setProducts(built)
     *
     * ERRADO:
     * setProducts([...products, built])
     */
    let savedProduct = null;

    if (editingId) {
      /*
       * EDIÇÃO
       */
      if (onEditProduct) {
        savedProduct =
          await onEditProduct(
            built
          );
      } else if (setProducts) {
        savedProduct =
          await setProducts(
            built
          );
      } else {
        throw new Error(
          "Nenhuma função de atualização de produto foi configurada."
        );
      }

    } else {
      /*
       * NOVO PRODUTO
       */
      if (onCreateProduct) {
        savedProduct =
          await onCreateProduct(
            built
          );
      } else if (setProducts) {
        savedProduct =
          await setProducts(
            built
          );
      } else {
        throw new Error(
          "Nenhuma função de criação de produto foi configurada."
        );
      }
    }

    /*
     * =================================================
     * CATEGORIA
     * =================================================
     *
     * A categoria só entra nas sugestões depois que
     * o produto foi efetivamente salvo.
     */
    if (
      savedProduct &&
      isValidSuggestionCategory(
        category
      )
    ) {
      saveCategoryToHistory(
        category
      );
    }

    /*
     * FECHA O FORMULÁRIO SOMENTE
     * APÓS O SALVAMENTO
     */
    cancelForm();

  } catch (error) {

    console.error(
      "[ESTOQUE] Erro ao salvar produto:",
      error
    );

    window.alert(
      error?.message ||
      "Não foi possível salvar o produto. Verifique o console para mais detalhes."
    );
  }
};

  /* =========================================================
     EXCLUIR PRODUTO
  ========================================================= */

  const removeProduct = async (id) => {
    const confirmed = window.confirm(
      "Deseja realmente remover este produto?",
    );

    if (!confirmed) return;

    try {
      if (onDeleteProduct) {
        await onDeleteProduct(id);
        return;
      }

      if (setProducts) {
        const currentProducts = Array.isArray(products)
          ? products
          : [];

        setProducts(
          currentProducts.filter(
            (product) => product.id !== id,
          ),
        );
      }
    } catch (error) {
      console.error(
        "Erro ao excluir produto:",
        error,
      );
    }
  };

  /* =========================================================
     FILTRO DE CATEGORIA
  ========================================================= */

  useEffect(() => {
    if (
      selectedCategory !== "Todas" &&
      !allCategories.some(
        (category) =>
          category === selectedCategory,
      )
    ) {
      setSelectedCategory("Todas");
    }
  }, [selectedCategory, allCategories]);

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) {
      return [];
    }

    return products.filter((product) => {
      const category =
        normalizeCategory(product?.category) ||
        "Sem categoria";

      return (
        selectedCategory === "Todas" ||
        category === selectedCategory
      );
    });
  }, [products, selectedCategory]);

  /* =========================================================
     GRID
  ========================================================= */

  const gridCols = [
    "2fr",
    "1fr",
    "0.7fr",
    "0.7fr",
    "0.8fr",
    "0.8fr",
    ...(stockLocations || []).map(() => "0.9fr"),
    "0.8fr",
  ].join(" ");

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div
      style={{
        fontFamily: FONT_BODY,
        width: "100%",
      }}
    >
      <SectionTitle
        title="Estoque"
        subtitle="Gerencie produtos, categorias, variações e quantidades em estoque."
        text={text}
        subtext={subtext}
      />

      {/* =====================================================
          LOCAIS DE ESTOQUE
      ===================================================== */}

      <button
        type="button"
        onClick={() =>
          setShowLocations((current) => !current)
        }
        style={{
          ...ghostBtn(border, text),
          marginBottom: 12,
        }}
      >
        {showLocations
          ? "Ocultar locais de estoque"
          : "Editar locais de estoque"}
      </button>

      {showLocations && (
        <div
          style={{
            background: card,
            border: `1px solid ${border}`,
            borderRadius: 12,
            padding: 14,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: text,
              marginBottom: 10,
            }}
          >
            Locais de estoque
          </div>

          {(stockLocations || []).map(
            (location) => (
              <input
                key={location.id}
                value={location.name || ""}
                onChange={(event) =>
                  renameLoc(
                    location.id,
                    event.target.value,
                  )
                }
                style={{
                  ...inputStyle(border, text),
                  width: "100%",
                  marginBottom: 6,
                }}
              />
            ),
          )}

          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 8,
            }}
          >
            <input
              value={newLocName}
              onChange={(event) =>
                setNewLocName(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  addLoc();
                }
              }}
              placeholder="Novo local (ex: Filial Boa Viagem)"
              style={{
                ...inputStyle(border, text),
                flex: 1,
              }}
            />

            <button
              type="button"
              onClick={addLoc}
              style={{
                background: accent,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 14px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              <Plus
                size={14}
                style={{
                  verticalAlign: "middle",
                  marginRight: 4,
                }}
              />
              Adicionar
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          BOTÃO NOVO PRODUTO
      ===================================================== */}

      <button
        type="button"
        onClick={() =>
          showForm
            ? cancelForm()
            : setShowForm(true)
        }
        style={{
          background: accent,
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          marginBottom: 16,
        }}
      >
        {showForm ? (
          <X size={15} />
        ) : (
          <Plus size={15} />
        )}

        {editingId
          ? "Editando produto"
          : "Cadastrar produto"}
      </button>

      {/* =====================================================
          FORMULÁRIO
      ===================================================== */}

      {showForm && (
        <div
          style={{
            background: card,
            border: `1px solid ${border}`,
            borderRadius: 12,
            padding: 16,
            marginBottom: 14,
          }}
        >
          {/* NOME */}

          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 700,
              color: text,
              marginBottom: 5,
            }}
          >
            Nome do produto
          </label>

          <input
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
            placeholder="Nome do produto"
            style={{
              ...inputStyle(border, text),
              width: "100%",
              marginBottom: 10,
            }}
          />

          {/* CATEGORIA */}

          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 700,
              color: text,
              marginBottom: 5,
            }}
          >
            Categoria
          </label>

          <div
            style={{
              position: "relative",
              marginBottom: 10,
            }}
          >
            <input
              list="byse-category-suggestions"
              value={form.category}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  category: event.target.value,
                }))
              }
              onBlur={(event) => {
                /*
                 * A categoria só é adicionada à sugestão
                 * quando o usuário realmente termina de
                 * preencher o campo.
                 */
                const value = normalizeCategory(
                  event.target.value,
                );

                if (
                  value &&
                  isValidSuggestionCategory(value)
                ) {
                  /*
                   * Não é obrigatório salvar aqui.
                   * O saveProduct também garante o registro.
                   */
                }
              }}
              placeholder="Digite ou selecione uma categoria"
              style={{
                ...inputStyle(border, text),
                width: "100%",
              }}
            />

            <datalist id="byse-category-suggestions">
              {categorySuggestions.map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                  />
                ),
              )}
            </datalist>
          </div>

          {allCategories.length > 0 && (
            <div
              style={{
                fontSize: 11,
                color: subtext,
                marginTop: -4,
                marginBottom: 10,
              }}
            >
              {allCategories.length} categoria
              {allCategories.length !== 1
                ? "s"
                : ""}{" "}
              disponível
              {allCategories.length !== 1
                ? "s"
                : ""}. Digite para filtrar as
              sugestões.
            </div>
          )}

          {/* CÓDIGOS */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
              marginBottom: 10,
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: text,
                  marginBottom: 5,
                }}
              >
                Código de barras
              </label>

              <input
                value={form.barcode}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    barcode: event.target.value,
                  }))
                }
                placeholder="Código de barras"
                style={inputStyle(border, text)}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: text,
                  marginBottom: 5,
                }}
              >
                Código rápido
              </label>

              <input
                value={form.code}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    code: event.target.value,
                  }))
                }
                placeholder="Código interno"
                style={inputStyle(border, text)}
              />
            </div>
          </div>

          {/* PREÇOS */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 10,
              marginBottom: 10,
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: text,
                  marginBottom: 5,
                }}
              >
                Custo
              </label>

              <input
                type="number"
                step="0.01"
                value={form.cost}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    cost: event.target.value,
                  }))
                }
                placeholder="0,00"
                style={inputStyle(border, text)}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: text,
                  marginBottom: 5,
                }}
              >
                Venda
              </label>

              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    price: event.target.value,
                  }))
                }
                placeholder="0,00"
                style={inputStyle(border, text)}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: text,
                  marginBottom: 5,
                }}
              >
                VIP à vista
              </label>

              <input
                type="number"
                step="0.01"
                value={form.vipPrice}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    vipPrice: event.target.value,
                  }))
                }
                placeholder="0,00"
                style={{
                  ...inputStyle(border, text),
                  borderColor: accent,
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: text,
                  marginBottom: 5,
                }}
              >
                VIP 3x
              </label>

              <input
                type="number"
                step="0.01"
                value={form.vipPrice3x}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    vipPrice3x: event.target.value,
                  }))
                }
                placeholder="0,00"
                style={{
                  ...inputStyle(border, text),
                  borderColor: accent,
                }}
              />
            </div>
          </div>

          {/* IMPOSTO E FRETE */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
              marginBottom: 10,
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: text,
                  marginBottom: 5,
                }}
              >
                Imposto
              </label>

              <input
                type="number"
                step="0.01"
                value={form.imposto}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    imposto: event.target.value,
                  }))
                }
                placeholder="0,00"
                style={{
                  ...inputStyle(border, text),
                  width: "100%",
                }}
              />

              <div
                style={{
                  fontSize: 10.5,
                  color: subtext,
                  marginTop: 3,
                }}
              >
                {pctOfCost(form.imposto) != null
                  ? `${pctOfCost(
                      form.imposto,
                    ).toFixed(1)}% do custo`
                  : "% do custo (automático)"}
              </div>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: text,
                  marginBottom: 5,
                }}
              >
                Frete
              </label>

              <input
                type="number"
                step="0.01"
                value={form.frete}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    frete: event.target.value,
                  }))
                }
                placeholder="0,00"
                style={{
                  ...inputStyle(border, text),
                  width: "100%",
                }}
              />

              <div
                style={{
                  fontSize: 10.5,
                  color: subtext,
                  marginTop: 3,
                }}
              >
                {pctOfCost(form.frete) != null
                  ? `${pctOfCost(
                      form.frete,
                    ).toFixed(1)}% do custo`
                  : "% do custo (automático)"}
              </div>
            </div>
          </div>

          {/* DESCRIÇÃO */}

          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 700,
              color: text,
              marginBottom: 5,
            }}
          >
            Descrição
          </label>

          <textarea
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            rows={2}
            placeholder="Descrição do produto"
            style={{
              ...inputStyle(border, text),
              width: "100%",
              marginBottom: 10,
              fontFamily: FONT_BODY,
              resize: "vertical",
            }}
          />

          {/* CONTROLE DE ESTOQUE / FOTO */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 14,
              flexWrap: "wrap",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                color: text,
              }}
            >
              <input
                type="checkbox"
                checked={Boolean(
                  form.controlStock,
                )}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    controlStock:
                      event.target.checked,
                  }))
                }
              />

              Controlar estoque
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12.5,
                color: subtext,
              }}
            >
              Foto:

              <input
                type="file"
                accept="image/*"
                onChange={handleImage}
                style={{
                  fontSize: 11,
                }}
              />
            </label>

            {form.imageUrl && (
              <img
                src={form.imageUrl}
                alt="Pré-visualização"
                style={{
                  width: 40,
                  height: 40,
                  objectFit: "cover",
                  borderRadius: 6,
                  border: `1px solid ${border}`,
                }}
              />
            )}
          </div>

          {/* ESTOQUE */}

          {form.controlStock && (
            <div
              style={{
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: text,
                  marginBottom: 6,
                }}
              >
                Estoque Principal / Global
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 14,
                }}
              >
                {(stockLocations || []).map(
                  (location) => (
                    <input
                      key={location.id}
                      placeholder={`Qtd. ${location.name}`}
                      type="number"
                      value={
                        form.stocks?.[
                          location.id
                        ] ?? ""
                      }
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          stocks: {
                            ...(current.stocks ||
                              {}),
                            [location.id]:
                              event.target.value,
                          },
                        }))
                      }
                      style={{
                        ...inputStyle(
                          border,
                          text,
                        ),
                        flex:
                          "1 1 140px",
                      }}
                    />
                  ),
                )}
              </div>

              {/* VARIAÇÕES */}

              <div
                style={{
                  borderTop: `1px dashed ${border}`,
                  paddingTop: 12,
                  marginTop: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: text,
                    }}
                  >
                    Subcategorias / Variações
                  </div>

                  <button
                    type="button"
                    onClick={addVariation}
                    style={{
                      background:
                        "transparent",
                      border: `1px solid ${accent}`,
                      color: accent,
                      borderRadius: 6,
                      padding:
                        "4px 10px",
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor:
                        "pointer",
                    }}
                  >
                    + Adicionar Variação
                  </button>
                </div>

                {(form.variations || []).map(
                  (variation) => (
                    <div
                      key={variation.id}
                      style={{
                        background: card,
                        border: `1px solid ${border}`,
                        borderRadius: 8,
                        padding: 10,
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          gap: 8,
                          alignItems:
                            "center",
                          marginBottom: 8,
                        }}
                      >
                        <input
                          placeholder='Nome da variação (ex: "Chocolate")'
                          value={
                            variation.name
                          }
                          onChange={(
                            event,
                          ) =>
                            updateVariationName(
                              variation.id,
                              event.target
                                .value,
                            )
                          }
                          style={{
                            ...inputStyle(
                              border,
                              text,
                            ),
                            flex: 1,
                          }}
                        />

                        <button
                          type="button"
                          onClick={() =>
                            removeVariation(
                              variation.id,
                            )
                          }
                          title="Remover variação"
                          style={{
                            background:
                              "none",
                            border:
                              "none",
                            cursor:
                              "pointer",
                            padding: 4,
                          }}
                        >
                          <Trash2
                            size={16}
                            color="#ef4444"
                          />
                        </button>
                      </div>

                      <div
                        style={{
                          display:
                            "flex",
                          gap: 8,
                          flexWrap:
                            "wrap",
                        }}
                      >
                        {(
                          stockLocations ||
                          []
                        ).map(
                          (location) => (
                            <input
                              key={
                                location.id
                              }
                              placeholder={`Qtd ${location.name}`}
                              type="number"
                              value={
                                variation
                                  .stocks?.[
                                  location.id
                                ] ?? ""
                              }
                              onChange={(
                                event,
                              ) =>
                                updateVariationStock(
                                  variation.id,
                                  location.id,
                                  event
                                    .target
                                    .value,
                                )
                              }
                              style={{
                                ...inputStyle(
                                  border,
                                  text,
                                ),
                                flex:
                                  "1 1 120px",
                              }}
                            />
                          ),
                        )}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          {/* BOTÕES */}

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={saveProduct}
              style={{
                background: accent,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Salvar produto
            </button>

            <button
              type="button"
              onClick={cancelForm}
              style={{
                background: "transparent",
                border: `1px solid ${border}`,
                color: text,
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          FILTRO E GESTÃO DE CATEGORIAS
      ===================================================== */}

      <div
        style={{
          background: card,
          border: `1px solid ${border}`,
          borderRadius: 12,
          padding: 12,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: text,
              whiteSpace: "nowrap",
            }}
          >
            Filtrar por categoria:
          </div>

          <select
            value={selectedCategory}
            onChange={(event) =>
              setSelectedCategory(
                event.target.value,
              )
            }
            style={{
              ...inputStyle(border, text),
              flex: "1 1 240px",
              minWidth: 220,
              cursor: "pointer",
              background: card,
            }}
          >
            <option value="Todas">
              Todas as categorias
            </option>

            {allCategories.map(
              (category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              ),
            )}
          </select>

          <div
            style={{
              fontSize: 11,
              color: subtext,
              whiteSpace: "nowrap",
            }}
          >
            {allCategories.length} categoria
            {allCategories.length !== 1
              ? "s"
              : ""}{" "}
            disponível
            {allCategories.length !== 1
              ? "s"
              : ""}
          </div>
        </div>

        {/* BOTÕES DE CATEGORIA */}

        {allCategories.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              marginTop: 10,
              paddingTop: 10,
              borderTop: `1px solid ${border}`,
              alignItems: "center",
            }}
          >
            <button
              type="button"
              onClick={() =>
                setSelectedCategory(
                  "Todas",
                )
              }
              style={{
                background:
                  selectedCategory ===
                  "Todas"
                    ? accent
                    : card,
                color:
                  selectedCategory ===
                  "Todas"
                    ? "#fff"
                    : text,
                border: `1px solid ${
                  selectedCategory ===
                  "Todas"
                    ? accent
                    : border
                }`,
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Todas
            </button>

            {allCategories.map(
              (category) => (
                <div
                  key={category}
                  style={{
                    display:
                      "inline-flex",
                    alignItems:
                      "center",
                    background:
                      selectedCategory ===
                      category
                        ? accent
                        : card,
                    color:
                      selectedCategory ===
                      category
                        ? "#fff"
                        : text,
                    border: `1px solid ${
                      selectedCategory ===
                      category
                        ? accent
                        : border
                    }`,
                    borderRadius: 8,
                    overflow:
                      "hidden",
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedCategory(
                        category,
                      )
                    }
                    style={{
                      background:
                        "transparent",
                      color:
                        "inherit",
                      border:
                        "none",
                      padding:
                        "6px 8px 6px 12px",
                      fontSize: 12,
                      fontWeight:
                        600,
                      cursor:
                        "pointer",
                    }}
                  >
                    {category}
                  </button>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      removeCategory(
                        category,
                      );
                    }}
                    title={`Remover "${category}" das sugestões`}
                    style={{
                      background:
                        "transparent",
                      color:
                        selectedCategory ===
                        category
                          ? "#fff"
                          : subtext,
                      border:
                        "none",
                      padding:
                        "6px 10px 6px 4px",
                      cursor:
                        "pointer",
                      display:
                        "flex",
                      alignItems:
                        "center",
                    }}
                  >
                    <X size={13} />
                  </button>
                </div>
              ),
            )}
          </div>
        )}
      </div>

      {/* =====================================================
          TABELA DE PRODUTOS
      ===================================================== */}

      <div
        style={{
          background: card,
          border: `1px solid ${border}`,
          borderRadius: 12,
          overflow: "auto",
        }}
      >
        {/* CABEÇALHO */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: gridCols,
            padding: "10px 14px",
            fontSize: 11,
            color: subtext,
            fontWeight: 700,
            borderBottom: `1px solid ${border}`,
            textTransform: "uppercase",
            minWidth: 700,
          }}
        >
          <div>Produto</div>
          <div>Categoria</div>
          <div>Custo</div>
          <div>Venda</div>
          <div>VIP À Vista</div>
          <div>VIP 3x</div>

          {(stockLocations || []).map(
            (location) => (
              <div key={location.id}>
                {location.name}
              </div>
            ),
          )}

          <div>Ações</div>
        </div>

        {/* VAZIO */}

        {filteredProducts.length === 0 && (
          <div
            style={{
              padding: 20,
              textAlign: "center",
              color: subtext,
              fontSize: 13,
            }}
          >
            Nenhum produto encontrado
            nesta categoria.
          </div>
        )}

        {/* PRODUTOS */}

        {filteredProducts.map(
          (product, index) => {
            const pVipPrice =
              product.vip_price !==
              undefined
                ? product.vip_price
                : product.vipPrice;

            const pVipPrice3x =
              product.vip_price_3x !==
              undefined
                ? product.vip_price_3x
                : product.vipPrice3x;

            const pControlStock =
              product.control_stock !==
              undefined
                ? product.control_stock
                : product.controlStock;

            const pImageUrl =
              product.image_url ||
              product.imageUrl;

            const pVariations =
              Array.isArray(
                product.variations,
              )
                ? product.variations
                : Array.isArray(
                      product.subcategories,
                    )
                  ? product.subcategories
                  : [];

            return (
              <div
                key={
                  product.id ||
                  `product-${index}`
                }
                onClick={() =>
                  setViewingProduct(
                    product,
                  )
                }
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    gridCols,
                  padding:
                    "12px 14px",
                  fontSize: 13,
                  alignItems:
                    "center",
                  borderBottom:
                    index <
                    filteredProducts.length -
                      1
                      ? `1px solid ${border}`
                      : "none",
                  minWidth: 700,
                  cursor:
                    "pointer",
                  transition:
                    "background 0.15s ease",
                }}
                onMouseEnter={(
                  event,
                ) => {
                  event.currentTarget.style.background = `${accent}08`;
                }}
                onMouseLeave={(
                  event,
                ) => {
                  event.currentTarget.style.background =
                    "transparent";
                }}
              >
                {/* PRODUTO */}

                <div
                  style={{
                    fontWeight: 600,
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap: 10,
                  }}
                >
                  {pImageUrl && (
                    <img
                      src={pImageUrl}
                      alt={
                        product.name
                      }
                      style={{
                        width: 32,
                        height: 32,
                        objectFit:
                          "cover",
                        borderRadius:
                          4,
                        flexShrink:
                          0,
                      }}
                    />
                  )}

                  <div>
                    <div>
                      {product.name}
                    </div>

                    {(product.barcode ||
                      product.code) && (
                      <div
                        style={{
                          fontSize: 11,
                          color: subtext,
                          fontWeight:
                            400,
                        }}
                      >
                        {product.code &&
                          `cód. ${product.code}`}

                        {product.code &&
                          product.barcode &&
                          " · "}

                        {product.barcode}
                      </div>
                    )}

                    {pVariations.length >
                      0 && (
                      <div
                        style={{
                          fontSize: 11,
                          color: subtext,
                          marginTop: 3,
                          fontWeight:
                            400,
                        }}
                      >
                        {pVariations.map(
                          (
                            variation,
                            variationIndex,
                          ) => {
                            const total =
                              Object.values(
                                variation.stocks ||
                                  {},
                              ).reduce(
                                (
                                  totalValue,
                                  value,
                                ) =>
                                  totalValue +
                                  (Number(
                                    value,
                                  ) || 0),
                                0,
                              );

                            return (
                              <span
                                key={
                                  variationIndex
                                }
                              >
                                {
                                  variation.name
                                }
                                : {total}

                                {variationIndex <
                                pVariations.length -
                                  1
                                  ? " | "
                                  : ""}
                              </span>
                            );
                          },
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* CATEGORIA */}

                <div>
                  {product.category ||
                    "Sem categoria"}
                </div>

                {/* CUSTO */}

                <div>
                  {money(product.cost)}
                </div>

                {/* VENDA */}

                <div
                  style={{
                    fontWeight: 700,
                  }}
                >
                  {money(
                    product.price,
                  )}
                </div>

                {/* VIP */}

                <div
                  style={{
                    fontWeight: 700,
                    color: accent,
                  }}
                >
                  {pVipPrice != null
                    ? money(
                        pVipPrice,
                      )
                    : "—"}
                </div>

                <div
                  style={{
                    fontWeight: 700,
                    color: accent,
                  }}
                >
                  {pVipPrice3x !=
                  null
                    ? money(
                        pVipPrice3x,
                      )
                    : "—"}
                </div>

                {/* ESTOQUE POR LOCAL */}

                {(stockLocations || []).map(
                  (location) => {
                    const variationsStock =
                      pVariations.reduce(
                        (
                          total,
                          variation,
                        ) =>
                          total +
                          (Number(
                            variation
                              .stocks?.[
                              location
                                .id
                            ],
                          ) || 0),
                        0,
                      );

                    const totalStock =
                      pVariations.length >
                      0
                        ? variationsStock
                        : Number(
                            product
                              .stocks?.[
                              location
                                .id
                            ] || 0,
                          );

                    return (
                      <div
                        key={
                          location.id
                        }
                      >
                        {pControlStock !==
                        false ? (
                          <>
                            <div>
                              {
                                totalStock
                              }
                            </div>

                            <div
                              style={{
                                marginTop: 3,
                              }}
                            >
                              <HBar
                                pct={Math.min(
                                  100,
                                  (totalStock /
                                    50) *
                                    100,
                                )}
                                color={
                                  accent
                                }
                                border={
                                  border
                                }
                                h={4}
                              />
                            </div>
                          </>
                        ) : (
                          <span
                            style={{
                              color:
                                subtext,
                            }}
                          >
                            —
                          </span>
                        )}
                      </div>
                    );
                  },
                )}

                {/* AÇÕES */}

                <div
                  style={{
                    display:
                      "flex",
                    gap: 6,
                  }}
                  onClick={(event) =>
                    event.stopPropagation()
                  }
                >
                  <button
                    type="button"
                    onClick={() =>
                      setViewingProduct(
                        product,
                      )
                    }
                    style={{
                      background:
                        "none",
                      border:
                        "none",
                      cursor:
                        "pointer",
                    }}
                    title="Ver detalhes"
                  >
                    <Eye
                      size={14}
                      color={
                        subtext
                      }
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      startEdit(
                        product,
                      )
                    }
                    style={{
                      background:
                        "none",
                      border:
                        "none",
                      cursor:
                        "pointer",
                    }}
                    title="Editar"
                  >
                    <Edit2
                      size={14}
                      color={
                        subtext
                      }
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      removeProduct(
                        product.id,
                      )
                    }
                    style={{
                      background:
                        "none",
                      border:
                        "none",
                      cursor:
                        "pointer",
                    }}
                    title="Excluir"
                  >
                    <Trash2
                      size={14}
                      color={
                        subtext
                      }
                    />
                  </button>
                </div>
              </div>
            );
          },
        )}
      </div>

      {/* =====================================================
          MODAL DE DETALHES
      ===================================================== */}

      {viewingProduct &&
        (() => {
          const product =
            viewingProduct;

          const vipPrice =
            product.vip_price !==
            undefined
              ? product.vip_price
              : product.vipPrice;

          const vipPrice3x =
            product.vip_price_3x !==
            undefined
              ? product.vip_price_3x
              : product.vipPrice3x;

          const controlStock =
            product.control_stock !==
            undefined
              ? product.control_stock
              : product.controlStock;

          const imageUrl =
            product.image_url ||
            product.imageUrl;

          const variations =
            Array.isArray(
              product.variations,
            )
              ? product.variations
              : Array.isArray(
                    product.subcategories,
                  )
                ? product.subcategories
                : [];

          return (
            <div
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor:
                  "rgba(0,0,0,0.6)",
                display: "flex",
                justifyContent:
                  "center",
                alignItems:
                  "center",
                zIndex: 1000,
                padding: 16,
              }}
              onClick={() =>
                setViewingProduct(
                  null,
                )
              }
            >
              <div
                style={{
                  background: card,
                  border: `1px solid ${border}`,
                  borderRadius: 16,
                  width: "100%",
                  maxWidth: 700,
                  maxHeight:
                    "90vh",
                  overflowY:
                    "auto",
                  padding: 24,
                  boxShadow:
                    "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
                  position:
                    "relative",
                }}
                onClick={(
                  event,
                ) =>
                  event.stopPropagation()
                }
              >
                {/* FECHAR */}

                <button
                  type="button"
                  onClick={() =>
                    setViewingProduct(
                      null,
                    )
                  }
                  style={{
                    position:
                      "absolute",
                    top: 16,
                    right: 16,
                    background:
                      "none",
                    border:
                      "none",
                    cursor:
                      "pointer",
                    color: text,
                    padding: 4,
                  }}
                >
                  <X size={20} />
                </button>

                {/* CABEÇALHO */}

                <div
                  style={{
                    display:
                      "flex",
                    gap: 16,
                    alignItems:
                      "flex-start",
                    marginBottom: 20,
                  }}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={
                        product.name
                      }
                      style={{
                        width: 90,
                        height: 90,
                        objectFit:
                          "cover",
                        borderRadius:
                          10,
                        border: `1px solid ${border}`,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 90,
                        height: 90,
                        background: `${accent}15`,
                        borderRadius:
                          10,
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        color: accent,
                        fontWeight:
                          700,
                        fontSize: 12,
                      }}
                    >
                      Sem foto
                    </div>
                  )}

                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        color: accent,
                        fontWeight:
                          700,
                        textTransform:
                          "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      {product.category ||
                        "Sem categoria"}
                    </div>

                    <h2
                      style={{
                        fontSize: 20,
                        fontWeight:
                          700,
                        color: text,
                        margin:
                          "0 0 6px 0",
                      }}
                    >
                      {
                        product.name
                      }
                    </h2>

                    <div
                      style={{
                        fontSize: 12,
                        color:
                          subtext,
                        display:
                          "flex",
                        gap: 12,
                        flexWrap:
                          "wrap",
                      }}
                    >
                      {product.code && (
                        <span>
                          Cód. rápido:{" "}
                          <strong>
                            {
                              product.code
                            }
                          </strong>
                        </span>
                      )}

                      {product.barcode && (
                        <span>
                          Cód. barras:{" "}
                          <strong>
                            {
                              product.barcode
                            }
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* DESCRIÇÃO */}

                {product.description && (
                  <div
                    style={{
                      marginBottom: 20,
                      background: `${border}20`,
                      padding: 12,
                      borderRadius: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight:
                          700,
                        color:
                          subtext,
                        textTransform:
                          "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      Descrição
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        color: text,
                        lineHeight: 1.4,
                      }}
                    >
                      {
                        product.description
                      }
                    </div>
                  </div>
                )}

                {/* PREÇOS */}

                <div
                  style={{
                    display:
                      "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(130px, 1fr))",
                    gap: 10,
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      background: `${border}15`,
                      padding: 10,
                      borderRadius: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color:
                          subtext,
                        fontWeight:
                          600,
                      }}
                    >
                      Custo
                    </div>

                    <div
                      style={{
                        fontSize: 14,
                        fontWeight:
                          700,
                        color: text,
                        marginTop: 2,
                      }}
                    >
                      {money(
                        product.cost,
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      background: `${border}15`,
                      padding: 10,
                      borderRadius: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color:
                          subtext,
                        fontWeight:
                          600,
                      }}
                    >
                      Venda Padrão
                    </div>

                    <div
                      style={{
                        fontSize: 14,
                        fontWeight:
                          700,
                        color: text,
                        marginTop: 2,
                      }}
                    >
                      {money(
                        product.price,
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      background: `${accent}15`,
                      border: `1px solid ${accent}40`,
                      padding: 10,
                      borderRadius: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color:
                          accent,
                        fontWeight:
                          600,
                      }}
                    >
                      VIP À Vista
                    </div>

                    <div
                      style={{
                        fontSize: 14,
                        fontWeight:
                          700,
                        color:
                          accent,
                        marginTop: 2,
                      }}
                    >
                      {vipPrice !=
                      null
                        ? money(
                            vipPrice,
                          )
                        : "—"}
                    </div>
                  </div>

                  <div
                    style={{
                      background: `${accent}15`,
                      border: `1px solid ${accent}40`,
                      padding: 10,
                      borderRadius: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color:
                          accent,
                        fontWeight:
                          600,
                      }}
                    >
                      VIP 3x S/ Juros
                    </div>

                    <div
                      style={{
                        fontSize: 14,
                        fontWeight:
                          700,
                        color:
                          accent,
                        marginTop: 2,
                      }}
                    >
                      {vipPrice3x !=
                      null
                        ? money(
                            vipPrice3x,
                          )
                        : "—"}
                    </div>
                  </div>
                </div>

                {/* IMPOSTO E FRETE */}

                <div
                  style={{
                    display:
                      "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap: 10,
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      background: `${border}15`,
                      padding: 10,
                      borderRadius: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color:
                          subtext,
                        fontWeight:
                          600,
                      }}
                    >
                      Imposto
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        fontWeight:
                          600,
                        color: text,
                        marginTop: 2,
                      }}
                    >
                      {money(
                        product.imposto,
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      background: `${border}15`,
                      padding: 10,
                      borderRadius: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color:
                          subtext,
                        fontWeight:
                          600,
                      }}
                    >
                      Frete
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        fontWeight:
                          600,
                        color: text,
                        marginTop: 2,
                      }}
                    >
                      {money(
                        product.frete,
                      )}
                    </div>
                  </div>
                </div>

                {/* ESTOQUE */}

                <div
                  style={{
                    borderTop: `1px solid ${border}`,
                    paddingTop: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight:
                        700,
                      color: text,
                      marginBottom: 12,
                    }}
                  >
                    Distribuição de
                    Estoque por Local
                  </div>

                  {controlStock ===
                  false ? (
                    <div
                      style={{
                        fontSize: 12,
                        color:
                          subtext,
                        fontStyle:
                          "italic",
                        marginBottom: 12,
                      }}
                    >
                      Este produto
                      está
                      configurado
                      para não
                      controlar
                      estoque.
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          display:
                            "grid",
                          gridTemplateColumns:
                            `repeat(${
                              Math.max(
                                1,
                                stockLocations.length,
                              )}, minmax(0, 1fr))`,
                          gap: 8,
                          marginBottom: 16,
                        }}
                      >
                        {(
                          stockLocations ||
                          []
                        ).map(
                          (
                            location,
                          ) => {
                            const variationStock =
                              variations.reduce(
                                (
                                  total,
                                  variation,
                                ) =>
                                  total +
                                  (Number(
                                    variation
                                      .stocks?.[
                                      location
                                        .id
                                    ],
                                  ) || 0),
                                0,
                              );

                            const totalStock =
                              variations.length >
                              0
                                ? variationStock
                                : Number(
                                    product
                                      .stocks?.[
                                      location
                                        .id
                                    ] ||
                                      0,
                                  );

                            return (
                              <div
                                key={
                                  location.id
                                }
                                style={{
                                  background:
                                    card,
                                  border: `1px solid ${border}`,
                                  padding: 10,
                                  borderRadius: 8,
                                  textAlign:
                                    "center",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 11,
                                    color:
                                      subtext,
                                    marginBottom:
                                      4,
                                  }}
                                >
                                  {
                                    location.name
                                  }
                                </div>

                                <div
                                  style={{
                                    fontSize: 16,
                                    fontWeight:
                                      700,
                                    color:
                                      accent,
                                  }}
                                >
                                  {
                                    totalStock
                                  }
                                </div>
                              </div>
                            );
                          },
                        )}
                      </div>

                      {/* VARIAÇÕES */}

                      {variations.length >
                        0 && (
                        <div>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight:
                                700,
                              color:
                                subtext,
                              marginBottom:
                                8,
                            }}
                          >
                            Detalhamento
                            por
                            Variações /
                            Subcategorias
                          </div>

                          <div
                            style={{
                              display:
                                "flex",
                              flexDirection:
                                "column",
                              gap: 6,
                            }}
                          >
                            {variations.map(
                              (
                                variation,
                                variationIndex,
                              ) => (
                                <div
                                  key={
                                    variation.id ||
                                    variationIndex
                                  }
                                  style={{
                                    background: `${border}10`,
                                    padding: 8,
                                    borderRadius: 6,
                                    display:
                                      "flex",
                                    justifyContent:
                                      "space-between",
                                    alignItems:
                                      "center",
                                    gap: 10,
                                    flexWrap:
                                      "wrap",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontWeight:
                                        600,
                                      fontSize:
                                        12,
                                      color:
                                        text,
                                    }}
                                  >
                                    {
                                      variation.name
                                    }
                                  </span>

                                  <div
                                    style={{
                                      display:
                                        "flex",
                                      gap: 12,
                                      fontSize:
                                        12,
                                      color:
                                        subtext,
                                      flexWrap:
                                        "wrap",
                                    }}
                                  >
                                    {(
                                      stockLocations ||
                                      []
                                    ).map(
                                      (
                                        location,
                                      ) => (
                                        <span
                                          key={
                                            location.id
                                          }
                                        >
                                          {
                                            location.name
                                          }
                                          :{" "}
                                          <strong
                                            style={{
                                              color:
                                                text,
                                            }}
                                          >
                                            {
                                              variation
                                                .stocks?.[
                                                location
                                                  .id
                                              ]
                                            ??
                                              0
                                            }</strong> 
                                
                                        </span>
                                      ),
                                    )}
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* BOTÕES MODAL */}

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "flex-end",
                    gap: 8,
                    marginTop: 24,
                    borderTop: `1px solid ${border}`,
                    paddingTop: 16,
                    flexWrap:
                      "wrap",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      const productToEdit =
                        viewingProduct;

                      setViewingProduct(
                        null,
                      );

                      startEdit(
                        productToEdit,
                      );
                    }}
                    style={{
                      background:
                        accent,
                      color: "#fff",
                      border:
                        "none",
                      borderRadius:
                        8,
                      padding:
                        "8px 16px",
                      fontSize: 13,
                      fontWeight:
                        600,
                      cursor:
                        "pointer",
                      display:
                        "flex",
                      alignItems:
                        "center",
                      gap: 6,
                    }}
                  >
                    <Edit2
                      size={14}
                    />

                    Editar Produto
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setViewingProduct(
                        null,
                      )
                    }
                    style={{
                      background:
                        "transparent",
                      border: `1px solid ${border}`,
                      color: text,
                      borderRadius:
                        8,
                      padding:
                        "8px 16px",
                      fontSize: 13,
                      fontWeight:
                        600,
                      cursor:
                        "pointer",
                    }}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}

